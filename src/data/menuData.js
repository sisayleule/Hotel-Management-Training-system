/**
 * Menu Data for F&B Waiter POS - Restaurant-Specific Menus
 * 
 * PRICING NOTE: Prices for Traditional Restaurant and Asia Restaurant items
 * are UNVERIFIED PLACEHOLDERS assigned based on typical item types and
 * consistency with existing price ranges (₹60-₹800). These should be verified
 * against actual restaurant pricing before production use.
 * 
 * Olympia and Sila items reuse existing verified menu data.
 */

// ============================================================================
// BAR OUTLET (Alcoholic + Beverages only)
// ============================================================================
export const BAR_MENU = {
  id: "bar",
  name: "Bar",
  categories: [
    { id: "alcoholic", name: "ALCOHOLIC", displayOrder: 1 },
    { id: "beverages", name: "BEVERAGES", displayOrder: 2 }
  ],
  items: [
    // ALCOHOLIC
    { id: "red_wine", name: "Red Wine", category: "alcoholic", price: 600, available: true },
    { id: "white_wine", name: "White Wine", category: "alcoholic", price: 650, available: true },
    { id: "beer", name: "Beer", category: "alcoholic", price: 300, available: true },
    { id: "whiskey", name: "Whiskey", category: "alcoholic", price: 800, available: true },
    { id: "cocktail", name: "Cocktail", category: "alcoholic", price: 500, available: true },
    
    // BEVERAGES
    { id: "coffee", name: "Coffee", category: "beverages", price: 100, available: true },
    { id: "tea", name: "Tea", category: "beverages", price: 80, available: true },
    { id: "fresh_juice", name: "Fresh Juice", category: "beverages", price: 120, available: true },
    { id: "soft_drink", name: "Soft Drink", category: "beverages", price: 60, available: true },
    { id: "lassi", name: "Lassi", category: "beverages", price: 90, available: true }
  ]
};

// ============================================================================
// ROOM SERVICE OUTLET (Full 8-category menu)
// ============================================================================
export const ROOM_SERVICE_MENU = {
  id: "room_service",
  name: "Room Service",
  categories: [
    { id: "starters", name: "STARTERS", displayOrder: 1 },
    { id: "main_course", name: "MAIN COURSE", displayOrder: 2 },
    { id: "desserts", name: "DESSERTS", displayOrder: 3 },
    { id: "beverages", name: "BEVERAGES", displayOrder: 4 },
    { id: "alcoholic", name: "ALCOHOLIC", displayOrder: 5 },
    { id: "snacks", name: "SNACKS", displayOrder: 6 },
    { id: "specials", name: "SPECIALS", displayOrder: 7 },
    { id: "breakfast", name: "BREAKFAST", displayOrder: 8 }
  ],
  items: [
    // Starters
    { id: "spring_rolls", name: "Spring Rolls", category: "starters", price: 250, available: true },
    { id: "soup_of_the_day", name: "Soup of the Day", category: "starters", price: 180, available: true },
    { id: "bruschetta", name: "Bruschetta", category: "starters", price: 220, available: true },
    { id: "caesar_salad", name: "Caesar Salad", category: "starters", price: 280, available: true },
    { id: "chicken_wings", name: "Chicken Wings", category: "starters", price: 320, available: true },
    
    // Main Course
    { id: "grilled_chicken", name: "Grilled Chicken", category: "main_course", price: 450, available: true },
    { id: "butter_chicken", name: "Butter Chicken", category: "main_course", price: 480, available: true },
    { id: "fish_and_chips", name: "Fish & Chips", category: "main_course", price: 520, available: true },
    { id: "pasta_alfredo", name: "Pasta Alfredo", category: "main_course", price: 420, available: true },
    { id: "vegetable_biryani", name: "Vegetable Biryani", category: "main_course", price: 380, available: true },
    
    // Desserts
    { id: "chocolate_cake", name: "Chocolate Cake", category: "desserts", price: 200, available: true },
    { id: "ice_cream", name: "Ice Cream", category: "desserts", price: 150, available: true },
    { id: "tiramisu", name: "Tiramisu", category: "desserts", price: 250, available: true },
    { id: "fruit_platter", name: "Fruit Platter", category: "desserts", price: 180, available: true },
    
    // Beverages
    { id: "coffee_rs", name: "Coffee", category: "beverages", price: 100, available: true },
    { id: "tea_rs", name: "Tea", category: "beverages", price: 80, available: true },
    { id: "fresh_juice_rs", name: "Fresh Juice", category: "beverages", price: 120, available: true },
    { id: "soft_drink_rs", name: "Soft Drink", category: "beverages", price: 60, available: true },
    { id: "lassi_rs", name: "Lassi", category: "beverages", price: 90, available: true },
    
    // Alcoholic
    { id: "red_wine_rs", name: "Red Wine", category: "alcoholic", price: 600, available: true },
    { id: "white_wine_rs", name: "White Wine", category: "alcoholic", price: 650, available: true },
    { id: "beer_rs", name: "Beer", category: "alcoholic", price: 300, available: true },
    { id: "whiskey_rs", name: "Whiskey", category: "alcoholic", price: 800, available: true },
    { id: "cocktail_rs", name: "Cocktail", category: "alcoholic", price: 500, available: true },
    
    // Snacks
    { id: "french_fries", name: "French Fries", category: "snacks", price: 150, available: true },
    { id: "nachos", name: "Nachos", category: "snacks", price: 180, available: true },
    { id: "samosa", name: "Samosa", category: "snacks", price: 100, available: true },
    { id: "pakora", name: "Pakora", category: "snacks", price: 120, available: true },
    
    // Specials
    { id: "chef_special", name: "Chef's Special", category: "specials", price: 700, available: true },
    { id: "seasonal_dish", name: "Seasonal Dish", category: "specials", price: 650, available: true },
    
    // Breakfast
    { id: "continental_breakfast", name: "Continental Breakfast", category: "breakfast", price: 350, available: true },
    { id: "indian_breakfast", name: "Indian Breakfast", category: "breakfast", price: 300, available: true },
    { id: "omelette", name: "Omelette", category: "breakfast", price: 180, available: true },
    { id: "pancakes", name: "Pancakes", category: "breakfast", price: 200, available: true }
  ]
};

// ============================================================================
// TRADITIONAL RESTAURANT
// ============================================================================
export const TRADITIONAL_RESTAURANT = {
  id: "traditional_restaurant",
  name: "Traditional Restaurant",
  categories: [
    { id: "main_dishes", name: "MAIN DISHES", displayOrder: 1 },
    { id: "vegetarian", name: "VEGETARIAN", displayOrder: 2 },
    { id: "breakfast", name: "BREAKFAST", displayOrder: 3 },
    { id: "traditional", name: "TRADITIONAL", displayOrder: 4 },
    { id: "bread_sides", name: "BREAD & SIDES", displayOrder: 5 },
    { id: "drinks", name: "DRINKS", displayOrder: 6 }
  ],
  items: [
    // MAIN DISHES - UNVERIFIED PLACEHOLDER PRICES
    { id: "doro_wot", name: "Doro Wot", category: "main_dishes", price: 480, available: true },
    { id: "tibs", name: "Tibs", category: "main_dishes", price: 520, available: true },
    { id: "kitfo", name: "Kitfo", category: "main_dishes", price: 550, available: true },
    { id: "shiro_wot", name: "Shiro Wot", category: "main_dishes", price: 380, available: true },
    { id: "misir_wot", name: "Misir Wot", category: "main_dishes", price: 350, available: true },
    { id: "gomen", name: "Gomen", category: "main_dishes", price: 320, available: true },
    { id: "alicha_wot", name: "Alicha Wot", category: "main_dishes", price: 400, available: true },
    
    // VEGETARIAN - UNVERIFIED PLACEHOLDER PRICES
    { id: "shiro", name: "Shiro", category: "vegetarian", price: 350, available: true },
    { id: "misir_wot_veg", name: "Misir Wot", category: "vegetarian", price: 320, available: true },
    { id: "kik_alicha", name: "Kik Alicha", category: "vegetarian", price: 300, available: true },
    { id: "gomen_veg", name: "Gomen", category: "vegetarian", price: 290, available: true },
    { id: "fosolia", name: "Fosolia", category: "vegetarian", price: 310, available: true },
    { id: "atakilt_wot", name: "Atakilt Wot", category: "vegetarian", price: 330, available: true },
    
    // BREAKFAST - UNVERIFIED PLACEHOLDER PRICES
    { id: "chechebsa", name: "Chechebsa", category: "breakfast", price: 200, available: true },
    { id: "firfir", name: "Firfir", category: "breakfast", price: 250, available: true },
    { id: "ful", name: "Ful", category: "breakfast", price: 220, available: true },
    { id: "genfo", name: "Genfo", category: "breakfast", price: 180, available: true },
    { id: "kinche", name: "Kinche", category: "breakfast", price: 190, available: true },
    
    // TRADITIONAL - UNVERIFIED PLACEHOLDER PRICES
    { id: "beyaynetu", name: "Beyaynetu", category: "traditional", price: 600, available: true },
    { id: "bozena_shiro", name: "Bozena Shiro", category: "traditional", price: 450, available: true },
    { id: "dulet", name: "Dulet", category: "traditional", price: 500, available: true },
    { id: "quanta_firfir", name: "Quanta Firfir", category: "traditional", price: 480, available: true },
    
    // BREAD & SIDES - UNVERIFIED PLACEHOLDER PRICES
    { id: "injera", name: "Injera", category: "bread_sides", price: 80, available: true },
    { id: "ambasha", name: "Ambasha", category: "bread_sides", price: 100, available: true },
    { id: "dabo", name: "Dabo", category: "bread_sides", price: 90, available: true },
    { id: "ayib", name: "Ayib", category: "bread_sides", price: 120, available: true },
    
    // DRINKS - UNVERIFIED PLACEHOLDER PRICES
    { id: "ethiopian_coffee", name: "Ethiopian Coffee", category: "drinks", price: 120, available: true },
    { id: "tej", name: "Tej", category: "drinks", price: 400, available: true },
    { id: "tella", name: "Tella", category: "drinks", price: 250, available: true },
    { id: "spris", name: "Spris", category: "drinks", price: 60, available: true },
    { id: "fresh_juice_trad", name: "Fresh Juice", category: "drinks", price: 120, available: true }
  ]
};

// ============================================================================
// ASIA RESTAURANT
// ============================================================================
export const ASIA_RESTAURANT = {
  id: "asia_restaurant",
  name: "Asia Restaurant",
  categories: [
    { id: "rice", name: "RICE", displayOrder: 1 },
    { id: "noodles", name: "NOODLES", displayOrder: 2 },
    { id: "chicken", name: "CHICKEN", displayOrder: 3 },
    { id: "beef", name: "BEEF", displayOrder: 4 },
    { id: "vegetarian", name: "VEGETARIAN", displayOrder: 5 },
    { id: "soups", name: "SOUPS", displayOrder: 6 },
    { id: "starters", name: "STARTERS", displayOrder: 7 },
    { id: "desserts", name: "DESSERTS", displayOrder: 8 },
    { id: "drinks", name: "DRINKS", displayOrder: 9 }
  ],
  items: [
    // RICE - UNVERIFIED PLACEHOLDER PRICES
    { id: "chicken_fried_rice", name: "Chicken Fried Rice", category: "rice", price: 380, available: true },
    { id: "vegetable_fried_rice", name: "Vegetable Fried Rice", category: "rice", price: 320, available: true },
    { id: "egg_fried_rice", name: "Egg Fried Rice", category: "rice", price: 300, available: true },
    { id: "biryani", name: "Biryani", category: "rice", price: 420, available: true },
    
    // NOODLES - UNVERIFIED PLACEHOLDER PRICES
    { id: "chicken_chow_mein", name: "Chicken Chow Mein", category: "noodles", price: 400, available: true },
    { id: "vegetable_chow_mein", name: "Vegetable Chow Mein", category: "noodles", price: 350, available: true },
    { id: "beef_noodles", name: "Beef Noodles", category: "noodles", price: 450, available: true },
    { id: "pad_thai", name: "Pad Thai", category: "noodles", price: 480, available: true },
    
    // CHICKEN - UNVERIFIED PLACEHOLDER PRICES
    { id: "chicken_teriyaki", name: "Chicken Teriyaki", category: "chicken", price: 520, available: true },
    { id: "sweet_sour_chicken", name: "Sweet & Sour Chicken", category: "chicken", price: 490, available: true },
    { id: "kung_pao_chicken", name: "Kung Pao Chicken", category: "chicken", price: 510, available: true },
    { id: "chicken_curry", name: "Chicken Curry", category: "chicken", price: 480, available: true },
    
    // BEEF - UNVERIFIED PLACEHOLDER PRICES
    { id: "beef_stir_fry", name: "Beef Stir-Fry", category: "beef", price: 580, available: true },
    { id: "mongolian_beef", name: "Mongolian Beef", category: "beef", price: 620, available: true },
    { id: "beef_curry", name: "Beef Curry", category: "beef", price: 590, available: true },
    { id: "beef_bulgogi", name: "Beef Bulgogi", category: "beef", price: 650, available: true },
    
    // VEGETARIAN - UNVERIFIED PLACEHOLDER PRICES
    { id: "vegetable_stir_fry", name: "Vegetable Stir-Fry", category: "vegetarian", price: 340, available: true },
    { id: "tofu_curry", name: "Tofu Curry", category: "vegetarian", price: 380, available: true },
    { id: "vegetable_spring_rolls", name: "Vegetable Spring Rolls", category: "vegetarian", price: 280, available: true },
    { id: "tofu_teriyaki", name: "Tofu Teriyaki", category: "vegetarian", price: 420, available: true },
    
    // SOUPS - UNVERIFIED PLACEHOLDER PRICES
    { id: "hot_sour_soup", name: "Hot & Sour Soup", category: "soups", price: 220, available: true },
    { id: "miso_soup", name: "Miso Soup", category: "soups", price: 180, available: true },
    { id: "chicken_noodle_soup", name: "Chicken Noodle Soup", category: "soups", price: 250, available: true },
    { id: "tom_yum", name: "Tom Yum", category: "soups", price: 280, available: true },
    
    // STARTERS - UNVERIFIED PLACEHOLDER PRICES
    { id: "spring_rolls_asia", name: "Spring Rolls", category: "starters", price: 250, available: true },
    { id: "dumplings", name: "Dumplings", category: "starters", price: 280, available: true },
    { id: "samosa_asia", name: "Samosa", category: "starters", price: 180, available: true },
    { id: "chicken_wings_asia", name: "Chicken Wings", category: "starters", price: 320, available: true },
    
    // DESSERTS - UNVERIFIED PLACEHOLDER PRICES
    { id: "mochi", name: "Mochi", category: "desserts", price: 200, available: true },
    { id: "fried_banana", name: "Fried Banana", category: "desserts", price: 150, available: true },
    { id: "mango_sticky_rice", name: "Mango Sticky Rice", category: "desserts", price: 220, available: true },
    { id: "coconut_rice_pudding", name: "Coconut Rice Pudding", category: "desserts", price: 180, available: true },
    
    // DRINKS - UNVERIFIED PLACEHOLDER PRICES
    { id: "green_tea", name: "Green Tea", category: "drinks", price: 100, available: true },
    { id: "milk_tea", name: "Milk Tea", category: "drinks", price: 120, available: true },
    { id: "thai_iced_tea", name: "Thai Iced Tea", category: "drinks", price: 140, available: true },
    { id: "ginger_tea", name: "Ginger Tea", category: "drinks", price: 90, available: true },
    { id: "fresh_fruit_juice", name: "Fresh Fruit Juice", category: "drinks", price: 130, available: true }
  ]
};

// ============================================================================
// SILA COFFEE SHOP
// ============================================================================
export const SILA_COFFEE_SHOP = {
  id: "sila_coffee_shop",
  name: "Sila Coffee Shop",
  categories: [
    { id: "desserts", name: "DESSERTS", displayOrder: 1 },
    { id: "drinks", name: "DRINKS", displayOrder: 2 }
  ],
  items: [
    // DESSERTS - reusing existing verified items
    { id: "chocolate_cake", name: "Chocolate Cake", category: "desserts", price: 200, available: true },
    { id: "ice_cream", name: "Ice Cream", category: "desserts", price: 150, available: true },
    { id: "tiramisu", name: "Tiramisu", category: "desserts", price: 250, available: true },
    { id: "fruit_platter", name: "Fruit Platter", category: "desserts", price: 180, available: true },
    
    // DRINKS - reusing existing verified items relevant to coffee shop
    { id: "coffee", name: "Coffee", category: "drinks", price: 100, available: true },
    { id: "tea", name: "Tea", category: "drinks", price: 80, available: true },
    { id: "fresh_juice", name: "Fresh Juice", category: "drinks", price: 120, available: true },
    { id: "soft_drink", name: "Soft Drink", category: "drinks", price: 60, available: true },
    { id: "lassi", name: "Lassi", category: "drinks", price: 90, available: true }
  ]
};

// ============================================================================
// OLYMPIA RESTAURANT
// ============================================================================
export const OLYMPIA_RESTAURANT = {
  id: "olympia_restaurant",
  name: "Olympia Restaurant",
  categories: [
    { id: "main_course", name: "MAIN COURSE", displayOrder: 1 }
  ],
  items: [
    // MAIN COURSE - reusing existing verified items
    { id: "grilled_chicken", name: "Grilled Chicken", category: "main_course", price: 450, available: true },
    { id: "butter_chicken", name: "Butter Chicken", category: "main_course", price: 480, available: true },
    { id: "fish_and_chips", name: "Fish & Chips", category: "main_course", price: 520, available: true },
    { id: "pasta_alfredo", name: "Pasta Alfredo", category: "main_course", price: 420, available: true },
    { id: "vegetable_biryani", name: "Vegetable Biryani", category: "main_course", price: 380, available: true }
  ]
};

// ============================================================================
// OUTLET/RESTAURANT REGISTRY
// ============================================================================
export const OUTLETS = {
  bar: BAR_MENU,
  room_service: ROOM_SERVICE_MENU
};

export const RESTAURANTS = {
  traditional_restaurant: TRADITIONAL_RESTAURANT,
  asia_restaurant: ASIA_RESTAURANT,
  sila_coffee_shop: SILA_COFFEE_SHOP,
  olympia_restaurant: OLYMPIA_RESTAURANT
};

// Helper function to get menu data
// - For bar/room_service outlets: returns outlet menu
// - For restaurant outlet: returns restaurant-specific menu
export const getMenuData = (outletId, restaurantId = null) => {
  // If outlet is bar or room_service, return outlet menu directly
  if (outletId === "bar" || outletId === "room_service") {
    return OUTLETS[outletId] || null;
  }
  
  // If outlet is restaurant, return restaurant-specific menu
  if (outletId === "restaurant" && restaurantId) {
    return RESTAURANTS[restaurantId] || null;
  }
  
  return null;
};

// Legacy helper for backward compatibility (now delegates to getMenuData)
export const getRestaurantData = (restaurantId) => {
  return RESTAURANTS[restaurantId] || null;
};
