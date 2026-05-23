import type {
  NutriRestaurantMenu,
  NutriRestaurantMenuStatus,
} from "../domain/types";

export type NutriRestaurantMenuInputItem = {
  mealName?: string;
  recipeId?: string;
  servings?: number;
};

export type NutriRestaurantMenuInput = {
  title?: string;
  date?: string;
  expectedMeals?: number;
  items?: NutriRestaurantMenuInputItem[];
  status?: NutriRestaurantMenuStatus;
};

export type NutriRestaurantMenusResponse = {
  menus: NutriRestaurantMenu[];
  summary: {
    total: number;
    draft: number;
    approved: number;
    archived: number;
  };
};

export type NutriRestaurantMenuResponse = {
  menu: NutriRestaurantMenu;
};
