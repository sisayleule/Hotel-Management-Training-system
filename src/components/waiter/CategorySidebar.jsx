import React from "react";

const CategorySidebar = ({ categories, selectedCategory, onCategorySelect }) => {
  return (
    <div className="flex flex-col gap-2">
      {categories.sort((a, b) => a.displayOrder - b.displayOrder).map((category) => {
        const isSelected = selectedCategory === category.id;
        
        return (
          <button
            key={category.id}
            onClick={() => onCategorySelect(category.id)}
            className="px-4 py-3 rounded-lg font-bold uppercase text-white text-sm transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: "#1a5c5c",
              border: isSelected ? "3px solid #ff8c42" : "3px solid transparent",
              boxShadow: isSelected ? "0 0 8px rgba(255, 140, 66, 0.5)" : "none"
            }}
          >
            {category.name}
          </button>
        );
      })}
    </div>
  );
};

export default CategorySidebar;
