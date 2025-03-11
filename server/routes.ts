import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { getFinancialAdvice } from "./openai";
import { insertBudgetSchema, insertExpenseSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Budget routes
  app.get("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const budgets = await storage.getBudgets(req.user.id);
    res.json(budgets);
  });

  app.post("/api/budgets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertBudgetSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const budget = await storage.createBudget(req.user.id, parsed.data);
    res.status(201).json(budget);
  });

  // Expense routes
  app.get("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const expenses = await storage.getExpenses(req.user.id);
    res.json(expenses);
  });

  app.post("/api/expenses", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const parsed = insertExpenseSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json(parsed.error);
    const expense = await storage.createExpense(req.user.id, parsed.data);
    res.status(201).json(expense);
  });

  // AI Chatbot route
  app.post("/api/chat", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Question is required" });

    try {
      const expenses = await storage.getExpenses(req.user.id);
      const budgets = await storage.getBudgets(req.user.id);

      const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      const totalBudget = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);

      const advice = await getFinancialAdvice(question, {
        expenses: totalExpenses,
        budget: totalBudget,
      });

      res.json({ response: advice });
    } catch (err: unknown) {
      const error = err as Error;
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}