export const expenseCategories = [
    "Housing",
    "Transportation",
    "Food",
    "Utilities",
    "Insurance",
    "Healthcare",
    "Entertainment",
    "Other"
  ] as const;
  
  export type ExpenseCategory = typeof expenseCategories[number];
  
  export const categoryKeywords: Record<ExpenseCategory, string[]> = {
    "Housing": ["rent", "mortgage", "apartment", "house", "property", "lease", "landlord", "housing"],
    "Transportation": ["gas", "fuel", "car", "taxi", "uber", "lyft", "public transport", "bus", "train", "metro", "subway", "parking", "maintenance", "transport"],
    "Food": ["food", "groceries", "restaurant", "dinner", "lunch", "breakfast", "takeout", "delivery", "coffee", "meal", "eat", "dining", "grocery"],
    "Utilities": ["electricity", "water", "gas bill", "internet", "phone", "mobile", "cable", "streaming", "netflix", "spotify", "utility"],
    "Insurance": ["insurance", "health insurance", "car insurance", "home insurance", "life insurance"],
    "Healthcare": ["doctor", "hospital", "pharmacy", "medicine", "drug", "clinic", "dentist", "optical", "health", "medical"],
    "Entertainment": ["movie", "cinema", "game", "concert", "music", "hobby", "sports", "gym", "fitness", "party", "bar", "alcohol", "entertain"],
    "Other": []
  };
  
  export function detectExpenseCategory(text: string, description: string): ExpenseCategory {
    const combinedText = `${text} ${description}`.toLowerCase();
    const desc = description.toLowerCase();
  
    // Check for direct matches first
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category as ExpenseCategory;
      }
    }
  
    // Check for partial matches in full text
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => combinedText.includes(keyword))) {
        return category as ExpenseCategory;
      }
    }
  
    // Special context cases
    if (/(netflix|spotify|subscription)/i.test(combinedText)) {
      return "Utilities";
    }
  
    if (/(medical|pharmacy|pill|hospital)/i.test(combinedText)) {
      return "Healthcare";
    }
  
    if (/(bar|beer|wine|liquor)/i.test(combinedText)) {
      return "Entertainment";
    }
  
    if (/(amazon|target|walmart|store)/i.test(combinedText)) {
      return "Other"; // Prompt user for clarification
    }
  
    return "Other";
  }