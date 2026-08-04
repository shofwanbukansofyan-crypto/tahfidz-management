import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// 1. ENDPOINT USERS
// ==========================================
app.get('/api/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const user = await prisma.user.create({ data: req.body });
  res.json(user);
});

app.put('/api/users/:id', async (req, res) => {
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(user);
});

app.delete('/api/users/:id', async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: "Deleted" });
});

// ==========================================
// 2. ENDPOINT HALAQAH
// ==========================================
app.get('/api/halaqahs', async (req, res) => {
  const halaqahs = await prisma.halaqah.findMany();
  res.json(halaqahs);
});

app.post('/api/halaqahs', async (req, res) => {
  const halaqah = await prisma.halaqah.create({ data: req.body });
  res.json(halaqah);
});

app.put('/api/halaqahs/:id', async (req, res) => {
  const halaqah = await prisma.halaqah.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(halaqah);
});

app.delete('/api/halaqahs/:id', async (req, res) => {
  await prisma.halaqah.delete({ where: { id: req.params.id } });
  res.json({ message: "Deleted" });
});

// ==========================================
// 3. ENDPOINT ZIYADAH
// ==========================================
app.get('/api/ziyadahs', async (req, res) => {
  const ziyadahs = await prisma.ziyadahRekap.findMany();
  res.json(ziyadahs);
});

app.post('/api/ziyadahs', async (req, res) => {
  const ziyadah = await prisma.ziyadahRekap.create({ data: req.body });
  res.json(ziyadah);
});

app.put('/api/ziyadahs/:id', async (req, res) => {
  const ziyadah = await prisma.ziyadahRekap.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(ziyadah);
});

app.delete('/api/ziyadahs/:id', async (req, res) => {
  await prisma.ziyadahRekap.delete({ where: { id: req.params.id } });
  res.json({ message: "Deleted" });
});

// ==========================================
// 4. ENDPOINT TARGET MINGGUAN
// ==========================================
app.get('/api/targets', async (req, res) => {
  const targets = await prisma.weekTarget.findMany();
  res.json(targets);
});

app.post('/api/targets', async (req, res) => {
  const target = await prisma.weekTarget.create({ data: req.body });
  res.json(target);
});

app.put('/api/targets/:id', async (req, res) => {
  const target = await prisma.weekTarget.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(target);
});

app.delete('/api/targets/:id', async (req, res) => {
  await prisma.weekTarget.delete({ where: { id: req.params.id } });
  res.json({ message: "Deleted" });
});

// ==========================================
// 5. ENDPOINT UJIAN
// ==========================================
app.get('/api/ujians', async (req, res) => {
  const ujians = await prisma.ujian.findMany();
  res.json(ujians);
});

app.post('/api/ujians', async (req, res) => {
  const ujian = await prisma.ujian.create({ data: req.body });
  res.json(ujian);
});

app.put('/api/ujians/:id', async (req, res) => {
  const ujian = await prisma.ujian.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(ujian);
});

// Jalankan Server
app.listen(PORT, () => {
  console.log(`✅ Backend Server berjalan di http://localhost:${PORT}`);
});