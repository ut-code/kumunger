import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { EqualApproximately } from 'lucide-react';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cookieParser())
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
// Serve static files from the dist directory (production build)
app.use(express.static(path.join(__dirname, '../dist')));

async function getUserId(sessionId) {
  try {
    const session = await prisma.session.findUnique({
      where: {
        id: sessionId ?? ''
      }
    });
    return session?.userId;
  } catch (error) {
    return null;
  }
}

app.post('/api/auth', async (req, res) => {
  try {
    const userId = await getUserId(req.cookies.session);
    if (userId) {
      const user = await prisma.user.findUnique({
        where: {
          id: userId
        }
      }); res.status(200).json({
        username: user.username
      });
    }
    else res.status(401).json({});
  } catch (error) {
    console.log('Failed to auth', error);
    res.status(401).json({});
  }
});

// Accept signin
app.post('/api/signin', async (req, res) => {
  try {
    const account = await prisma.user.findUnique({
      where: {
        username: req.body.username
      }
    });

    if (!account) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    if (account.password != req.body.password) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const session = await prisma.session.create({
      data: {
        userId: account.id
      }
    });

    res.cookie('session', session.id, {
      maxAge: 1 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    });
    res.json(session);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
      }
    }
    console.error('Error Accepting Sign in:', error);
    res.status(500).json({ error: 'Failed to Sign in' });
  }
});

// Accept sign up
app.post('/api/signup', async (req, res) => {
  try {
    const account = await prisma.user.create({
      data: {
        username: req.body.username,
        password: req.body.password
      }
    });
    res.json(account);
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          res.status(401).json({ error: 'Username already taken' });
          return;
      }
    }
    console.error('Error Accepting Sign up:', error);
    res.status(500).json({ error: 'Failed to Sign up' });
  }
});

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

// Create or update shift assignment
app.post('/api/assignments', async (req, res) => {
  try {
    const { formId, assignments, status } = req.body;

    // Check if assignment already exists for this form
    let existingAssignment = await prisma.shiftAssignment.findFirst({
      where: { formId }
    });

    if (existingAssignment) {
      // Delete existing assignments and recreate
      await prisma.assignment.deleteMany({
        where: { assignmentId: existingAssignment.id }
      });

      const updatedAssignment = await prisma.shiftAssignment.update({
        where: { id: existingAssignment.id },
        data: {
          status: status || 'confirmed',
          updatedAt: new Date(),
          assignments: {
            create: assignments.map(assignment => ({
              slotId: assignment.slotId,
              staffAssignments: {
                create: assignment.staffAssignments.map(staff => ({
                  staffId: staff.staffId,
                  staffName: staff.staffName,
                  role: staff.role || null,
                  isConfirmed: staff.isConfirmed || false
                }))
              }
            }))
          }
        },
        include: {
          assignments: {
            include: {
              staffAssignments: true
            }
          }
        }
      });

      res.json(updatedAssignment);
    } else {
      // Create new assignment
      const newAssignment = await prisma.shiftAssignment.create({
        data: {
          formId,
          status: status || 'confirmed',
          assignments: {
            create: assignments.map(assignment => ({
              slotId: assignment.slotId,
              staffAssignments: {
                create: assignment.staffAssignments.map(staff => ({
                  staffId: staff.staffId,
                  staffName: staff.staffName,
                  role: staff.role || null,
                  isConfirmed: staff.isConfirmed || false
                }))
              }
            }))
          }
        },
        include: {
          assignments: {
            include: {
              staffAssignments: true
            }
          }
        }
      });

      res.json(newAssignment);
    }
  } catch (error) {
    console.error('Error creating/updating assignment:', error);
    res.status(500).json({ error: 'Failed to create/update assignment' });
  }
});

// Get assignment by form ID
app.get('/api/forms/:formId/assignment', async (req, res) => {
  try {
    const { formId } = req.params;

    const assignment = await prisma.shiftAssignment.findFirst({
      where: { formId },
      include: {
        assignments: {
          include: {
            staffAssignments: true
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Get assignment by ID
app.get('/api/assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.shiftAssignment.findUnique({
      where: { id },
      include: {
        form: {
          include: {
            timeSlots: true
          }
        },
        assignments: {
          include: {
            staffAssignments: true
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Update assignment status
app.patch('/api/assignments/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedAssignment = await prisma.shiftAssignment.update({
      where: { id },
      data: {
        status,
        publishedAt: status === 'published' ? new Date() : undefined,
        updatedAt: new Date()
      },
      include: {
        assignments: {
          include: {
            staffAssignments: true
          }
        }
      }
    });

    res.json(updatedAssignment);
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({ error: 'Failed to update assignment status' });
  }
});

// Catch-all handler: send back React's index.html file for any non-API routes
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});