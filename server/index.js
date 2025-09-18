import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from the dist directory (production build)
app.use(express.static(path.join(__dirname, '../dist')));

// Create new form
app.post('/api/forms', async (req, res) => {
  try {
    const { 
      title, 
      description, 
      startDate, 
      endDate, 
      timeSlots, 
      additionalQuestions, 
      requiredRoles,
      isActive 
    } = req.body;

    const form = await prisma.shiftForm.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: isActive ?? true,
        timeSlots: {
          create: timeSlots.map(slot => ({
            date: new Date(slot.date),
            startTime: slot.startTime,
            endTime: slot.endTime,
            requiredStaff: slot.requiredStaff,
            minStaff: slot.minStaff,
            maxStaff: slot.maxStaff,
          }))
        },
        additionalQuestions: {
          create: additionalQuestions.map(q => ({
            type: q.type,
            label: q.label,
            required: q.required,
            options: q.options || null,
          }))
        },
        requiredRoles: {
          create: requiredRoles.map(role => ({
            name: role.name,
            color: role.color,
            minRequired: role.minRequired,
            maxAllowed: role.maxAllowed,
          }))
        }
      },
      include: {
        timeSlots: true,
        additionalQuestions: true,
        requiredRoles: true,
      }
    });

    res.json(form);
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Get all forms
app.get('/api/forms', async (req, res) => {
  try {
    const forms = await prisma.shiftForm.findMany({
      include: {
        timeSlots: true,
        additionalQuestions: true,
        requiredRoles: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// Get form by ID
app.get('/api/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const form = await prisma.shiftForm.findUnique({
      where: { id },
      include: {
        timeSlots: true,
        additionalQuestions: true,
        requiredRoles: true,
        submissions: {
          include: {
            availableSlots: true
          }
        }
      }
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// Update form
app.put('/api/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Delete existing related records if updating
    if (updateData.timeSlots) {
      await prisma.timeSlot.deleteMany({ where: { formId: id } });
    }
    if (updateData.additionalQuestions) {
      await prisma.question.deleteMany({ where: { formId: id } });
    }
    if (updateData.requiredRoles) {
      await prisma.role.deleteMany({ where: { formId: id } });
    }

    const form = await prisma.shiftForm.update({
      where: { id },
      data: {
        title: updateData.title,
        description: updateData.description,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        endDate: updateData.endDate ? new Date(updateData.endDate) : undefined,
        isActive: updateData.isActive,
        shareUrl: updateData.shareUrl,
        qrCode: updateData.qrCode,
        timeSlots: updateData.timeSlots ? {
          create: updateData.timeSlots.map(slot => ({
            date: new Date(slot.date),
            startTime: slot.startTime,
            endTime: slot.endTime,
            requiredStaff: slot.requiredStaff,
            minStaff: slot.minStaff,
            maxStaff: slot.maxStaff,
          }))
        } : undefined,
        additionalQuestions: updateData.additionalQuestions ? {
          create: updateData.additionalQuestions.map(q => ({
            type: q.type,
            label: q.label,
            required: q.required,
            options: q.options || null,
          }))
        } : undefined,
        requiredRoles: updateData.requiredRoles ? {
          create: updateData.requiredRoles.map(role => ({
            name: role.name,
            color: role.color,
            minRequired: role.minRequired,
            maxAllowed: role.maxAllowed,
          }))
        } : undefined,
      },
      include: {
        timeSlots: true,
        additionalQuestions: true,
        requiredRoles: true,
      }
    });

    res.json(form);
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// Delete form
app.delete('/api/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.shiftForm.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// Generate share URL
app.post('/api/forms/:id/share-url', async (req, res) => {
  try {
    const { id } = req.params;
    const { baseUrl } = req.body;
    
    const shareUrl = `${baseUrl}/submit/${id}`;
    
    const form = await prisma.shiftForm.update({
      where: { id },
      data: { shareUrl },
      include: {
        timeSlots: true,
        additionalQuestions: true,
        requiredRoles: true,
      }
    });

    res.json(form);
  } catch (error) {
    console.error('Error generating share URL:', error);
    res.status(500).json({ error: 'Failed to generate share URL' });
  }
});

// Generate QR code
app.post('/api/forms/:id/qr-code', async (req, res) => {
  try {
    const { id } = req.params;
    const { qrCode } = req.body;
    
    const form = await prisma.shiftForm.update({
      where: { id },
      data: { qrCode },
      include: {
        timeSlots: true,
        additionalQuestions: true,
        requiredRoles: true,
      }
    });

    res.json(form);
  } catch (error) {
    console.error('Error saving QR code:', error);
    res.status(500).json({ error: 'Failed to save QR code' });
  }
});

// Create submission
app.post('/api/submissions', async (req, res) => {
  try {
    const {
      formId,
      staffName,
      email,
      phoneNumber,
      availableSlots,
      answers,
      priority
    } = req.body;

    const submission = await prisma.shiftSubmission.create({
      data: {
        formId,
        staffName,
        email,
        phoneNumber,
        answers: answers || {},
        priority,
        availableSlots: {
          create: availableSlots.map(slot => ({
            slotId: slot.slotId,
            isAvailable: slot.isAvailable,
            preferredRole: slot.preferredRole,
            notes: slot.notes,
          }))
        }
      },
      include: {
        availableSlots: true
      }
    });

    res.json(submission);
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

// Get submissions by form
app.get('/api/forms/:formId/submissions', async (req, res) => {
  try {
    const { formId } = req.params;
    
    const submissions = await prisma.shiftSubmission.findMany({
      where: { formId },
      include: {
        availableSlots: true
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get all submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const submissions = await prisma.shiftSubmission.findMany({
      include: {
        availableSlots: true
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get submission by ID
app.get('/api/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await prisma.shiftSubmission.findUnique({
      where: { id },
      include: {
        availableSlots: true
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Delete submission
app.delete('/api/submissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.shiftSubmission.delete({
      where: { id }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting submission:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});