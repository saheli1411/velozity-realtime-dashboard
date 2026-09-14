import { PrismaClient, Role, TaskStatus, Priority } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('Password@123', 10);

  const admin = await prisma.user.create({
    data: { name: 'Super Admin', email: 'admin@velozity.com', password: hashedPassword, role: Role.ADMIN },
  });

  const pm1 = await prisma.user.create({
    data: { name: 'Sarah PM', email: 'sarah.pm@velozity.com', password: hashedPassword, role: Role.PROJECT_MANAGER },
  });

  const pm2 = await prisma.user.create({
    data: { name: 'David PM', email: 'david.pm@velozity.com', password: hashedPassword, role: Role.PROJECT_MANAGER },
  });

  const dev1 = await prisma.user.create({
    data: { name: 'Ravi Dev', email: 'ravi@velozity.com', password: hashedPassword, role: Role.DEVELOPER },
  });
  const dev2 = await prisma.user.create({
    data: { name: 'Elena Dev', email: 'elena@velozity.com', password: hashedPassword, role: Role.DEVELOPER },
  });
  const dev3 = await prisma.user.create({
    data: { name: 'Aiden Dev', email: 'aiden@velozity.com', password: hashedPassword, role: Role.DEVELOPER },
  });
  const dev4 = await prisma.user.create({
    data: { name: 'Priya Dev', email: 'priya@velozity.com', password: hashedPassword, role: Role.DEVELOPER },
  });

  const clientA = await prisma.client.create({
    data: { name: 'Acme Corporation', email: 'billing@acme.com' },
  });

  const pastDate = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
  const futureDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);

  const project1 = await prisma.project.create({
    data: { name: 'E-Commerce Platform', clientId: clientA.id, creatorId: pm1.id },
  });
  const project2 = await prisma.project.create({
    data: { name: 'Healthcare Mobile App', clientId: clientA.id, creatorId: pm1.id },
  });
  const project3 = await prisma.project.create({
    data: { name: 'FinTech Microservices', clientId: clientA.id, creatorId: pm2.id },
  });

  const tasksData = [
    { title: 'Setup Payment Gateway', status: TaskStatus.IN_PROGRESS, priority: Priority.CRITICAL, dueDate: pastDate, isOverdue: true, projectId: project1.id, developerId: dev1.id },
    { title: 'OAuth2 Authentication', status: TaskStatus.TODO, priority: Priority.HIGH, dueDate: pastDate, isOverdue: true, projectId: project2.id, developerId: dev2.id },
    { title: 'Design Product Catalog UI', status: TaskStatus.DONE, priority: Priority.MEDIUM, dueDate: futureDate, isOverdue: false, projectId: project1.id, developerId: dev1.id },
    { title: 'Checkout Cart Integration', status: TaskStatus.IN_REVIEW, priority: Priority.HIGH, dueDate: futureDate, isOverdue: false, projectId: project1.id, developerId: dev2.id },
    { title: 'Search & Filtering System', status: TaskStatus.TODO, priority: Priority.LOW, dueDate: futureDate, isOverdue: false, projectId: project1.id, developerId: dev3.id },
    { title: 'Inventory Alert Webhooks', status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM, dueDate: futureDate, isOverdue: false, projectId: project1.id, developerId: dev4.id },
    { title: 'Patient Profile Dashboard', status: TaskStatus.TODO, priority: Priority.HIGH, dueDate: futureDate, isOverdue: false, projectId: project2.id, developerId: dev2.id },
    { title: 'Doctor Slot Booking API', status: TaskStatus.IN_REVIEW, priority: Priority.CRITICAL, dueDate: futureDate, isOverdue: false, projectId: project2.id, developerId: dev1.id },
    { title: 'Push Notification Service', status: TaskStatus.DONE, priority: Priority.MEDIUM, dueDate: futureDate, isOverdue: false, projectId: project2.id, developerId: dev3.id },
    { title: 'HIPAA Compliance Audit', status: TaskStatus.IN_PROGRESS, priority: Priority.CRITICAL, dueDate: futureDate, isOverdue: false, projectId: project2.id, developerId: dev4.id },
    { title: 'Ledger Event Sourcing', status: TaskStatus.TODO, priority: Priority.HIGH, dueDate: futureDate, isOverdue: false, projectId: project3.id, developerId: dev3.id },
    { title: 'Currency Exchange Cache', status: TaskStatus.IN_PROGRESS, priority: Priority.MEDIUM, dueDate: futureDate, isOverdue: false, projectId: project3.id, developerId: dev4.id },
    { title: 'Fraud Detection Rules', status: TaskStatus.TODO, priority: Priority.CRITICAL, dueDate: futureDate, isOverdue: false, projectId: project3.id, developerId: dev1.id },
    { title: 'KYC Document Validation', status: TaskStatus.IN_REVIEW, priority: Priority.HIGH, dueDate: futureDate, isOverdue: false, projectId: project3.id, developerId: dev2.id },
    { title: 'Account Statement Export', status: TaskStatus.DONE, priority: Priority.LOW, dueDate: futureDate, isOverdue: false, projectId: project3.id, developerId: dev3.id }
  ];

  for (const t of tasksData) {
    const task = await prisma.task.create({ data: t });
    await prisma.activityLog.create({
      data: {
        message: `Task "${task.title}" initialized as ${task.status}`,
        taskId: task.id,
        projectId: task.projectId,
        userId: task.developerId,
        fromStatus: null,
        toStatus: task.status
      }
    });
  }

  console.log('Seed data inserted successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });