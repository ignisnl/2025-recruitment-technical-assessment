import express, { Request, Response } from "express";

// ==== Type Definitions, feel free to add or modify ==========================

interface requiredItem {
  name: string;
  quantity: number;
}

interface recipe {
  type: "recipe";
  requiredItems: requiredItem[];
}

interface ingredient {
  type: "ingredient";
  cookTime: number;
}
type cookbookEntry = (recipe | ingredient) & {
  name: string;
};

// =============================================================================
// ==== HTTP Endpoint Stubs ====================================================
// =============================================================================
const app = express();
app.use(express.json());

// Store your recipes here!
const cookbook: Array<cookbookEntry> = [];

// Task 1 helper (don't touch)
app.post("/parse", (req: Request, res: Response) => {
  const { input } = req.body;

  const parsed_string = parse_handwriting(input);
  if (parsed_string == null) {
    res.status(400).send("this string is cooked");
    return;
  }
  res.json({ msg: parsed_string });
  return;
});

// [TASK 1] ====================================================================
// Takes in a recipeName and returns it in a form that
const parse_handwriting = (recipeName: string): string | null => {
  recipeName = recipeName
    .replace(/[-_]/g, " ")
    .replace(/[^a-zA-Z ]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (s) => s.toUpperCase());
  return recipeName.length !== 0 ? recipeName : null;
};

// [TASK 2] ====================================================================
// Endpoint that adds a CookbookEntry to your magical cookbook
app.post("/entry", (req: Request, res: Response) => {
  const data: cookbookEntry = req.body;
  if (cookbook.find((x) => x.name === data.name) !== undefined) {
    res.status(400).send(`entry with name ${data.name} already exists`);
    return;
  }

  if (data.type !== "recipe" && data.type !== "ingredient") {
    res.status(400).send("invalid type");
    return;
  }

  if (data.type === "recipe") {
    if (
      [...new Set(data.requiredItems.map((item) => item.name))].length !==
      data.requiredItems.length
    ) {
      res.status(400).send("multiple required items with same name");
      return;
    }

    cookbook.push(data);
  } else if (data.type === "ingredient") {
    if (data.cookTime < 0) {
      res.status(400).send("invalid cook time");
      return;
    }

    cookbook.push(data);
  }

  res.json({});
  return;
});

// [TASK 3] ====================================================================
// Endpoint that returns a summary of a recipe that corresponds to a query name
app.get("/summary", (req: Request, res: Response) => {
  const recipe = cookbook.find((x) => x.name === req.query.name);
  if (recipe === undefined) {
    res.status(400).send(`no recipe "${req.query.name}" found`);
    return;
  }
  if (recipe.type === "ingredient") {
    res.status(400).send(`"${req.query.name}" is not a recipe`);
    return;
  }

  if (recipe.type === "recipe") {
    const { cookTime, ingredients } = calculate_recipe_ingredients(recipe, res);
    res.json({ name: recipe.name, cookTime, ingredients });
    return;
  }
});

const calculate_recipe_ingredients = (
  recipe: recipe & { name: string },
  res: Response
): { cookTime: number; ingredients: Array<requiredItem> } => {
  let cookTime = 0;
  const ingredients: Array<requiredItem> = [];
  for (const item of recipe.requiredItems) {
    const itemEntry = cookbook.find((x) => x.name === item.name);
    if (itemEntry === undefined) {
      res
        .status(400)
        .send(
          `recipe "${recipe.name}" contains component item "${item.name}" not in cookbook`
        );
      return;
    }

    if (itemEntry.type === "recipe") {
      const { cookTime: subCookTime, ingredients: subIngredients } =
        calculate_recipe_ingredients(itemEntry, res);
      cookTime += subCookTime * item.quantity;
      for (const subIngredient of subIngredients) {
        if (
          ingredients.find((x) => x.name === subIngredient.name) !== undefined
        ) {
          ingredients.find((x) => x.name === subIngredient.name).quantity +=
            item.quantity * subIngredient.quantity;
        } else {
          subIngredient.quantity *= item.quantity;
          ingredients.push(subIngredient);
        }
      }
    } else if (itemEntry.type === "ingredient") {
      cookTime += item.quantity * itemEntry.cookTime;
      if (ingredients.find((x) => x.name === item.name) !== undefined) {
        ingredients.find((x) => x.name === item.name).quantity += item.quantity;
      } else {
        ingredients.push(item);
      }
    }
  }
  return { cookTime, ingredients };
};

// =============================================================================
// ==== DO NOT TOUCH ===========================================================
// =============================================================================
const port = 8080;
app.listen(port, () => {
  console.log(`Running on: http://127.0.0.1:8080`);
});
