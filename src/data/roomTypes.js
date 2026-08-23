export const roomTypes = [
  {
    type_code: "STD",
    type_name: "Standard",
    rates: {
      single: 2500,
      double: 2800,
      extra_adult: 500
    },
    max_adults: 2,
    max_children: 1
  },
  {
    type_code: "SGL",
    type_name: "Single",
    rates: {
      single: 2000,
      double: 2000,
      extra_adult: 400
    },
    max_adults: 1,
    max_children: 0
  },
  {
    type_code: "DLX",
    type_name: "Deluxe",
    rates: {
      single: 3500,
      double: 3800,
      extra_adult: 700
    },
    max_adults: 3,
    max_children: 2
  },
  {
    type_code: "SUI",
    type_name: "Suite",
    rates: {
      single: 5500,
      double: 6000,
      extra_adult: 1000
    },
    max_adults: 4,
    max_children: 2
  },
  {
    type_code: "FAM",
    type_name: "Family/VIP",
    rates: {
      single: 7500,
      double: 8000,
      extra_adult: 1200
    },
    max_adults: 6,
    max_children: 4
  }
];

export default roomTypes;
