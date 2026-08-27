// ============================================================================
// CITY RIDERS LOGISTICS — SHIPPING RATE CARD 2026
// Ref: CR/2026/FA-001 (updates communicated June 19, 2026)
// ----------------------------------------------------------------------------
// Base prices live here. Admin can override any of them from the Admin >
// Settings > Shipping Rates editor; overrides are merged on top of these
// base values at checkout time (see src/utils/shippingRates.js).
// ============================================================================

export const LAGOS_SHIPPING_DATA = {
    // 1. UPDATED LOCATIONS (SAME DAY DELIVERY)
    "Abijo": { price: 5000, speed: "Same Day Delivery" },
    "Abule Ado": { price: 6000, speed: "Same Day Delivery" },
    "Abuleegba": { price: 4000, speed: "Same Day Delivery" },
    "Agbara": { price: 6000, speed: "Same Day Delivery" },
    "Agege": { price: 4000, speed: "Same Day Delivery" },
    "Ago palace": { price: 3500, speed: "Same Day Delivery" },
    "Agungi": { price: 4000, speed: "Same Day Delivery" },
    "Ajah": { price: 5000, speed: "Same Day Delivery" },
    "Ajao Estate": { price: 3500, speed: "Same Day Delivery" },
    "Ajegunle": { price: 4000, speed: "Same Day Delivery" },
    "Akowonjo": { price: 4000, speed: "Same Day Delivery" },
    "Akute": { price: 6000, speed: "Same Day Delivery" },
    "Alaguntan": { price: 4000, speed: "Same Day Delivery" },
    "Alaagbado": { price: 6000, speed: "Same Day Delivery" },
    "Alapere": { price: 3000, speed: "Same Day Delivery" },
    "Alimosho": { price: 4000, speed: "Same Day Delivery" },
    "Amuwo": { price: 4000, speed: "Same Day Delivery" },
    "Anthony": { price: 3500, speed: "Same Day Delivery" },
    "Apapa": { price: 4000, speed: "Same Day Delivery" },
    "Araga": { price: 6000, speed: "Same Day Delivery" },
    "Arepo": { price: 6000, speed: "Same Day Delivery" },
    "Asese": { price: 6000, speed: "Same Day Delivery" },
    "Awoyaya": { price: 5000, speed: "Same Day Delivery" },
    "Ayobo": { price: 4000, speed: "Same Day Delivery" },
    "Badagry": { price: 6000, speed: "Same Day Delivery" },
    "Badore": { price: 5000, speed: "Same Day Delivery" },
    "Bariga": { price: 3500, speed: "Same Day Delivery" },
    "Cement": { price: 3500, speed: "Same Day Delivery" },
    "Chevron": { price: 4000, speed: "Same Day Delivery" },
    "Costain": { price: 3500, speed: "Same Day Delivery" },
    "Dangote Refinery": { price: 6000, speed: "Same Day Delivery" },
    "Ebute Metta": { price: 3500, speed: "Same Day Delivery" },
    "Egbeda": { price: 4000, speed: "Same Day Delivery" },
    "Ejigbo": { price: 4000, speed: "Same Day Delivery" },
    "Epe Ibeju": { price: 6000, speed: "Same Day Delivery" },
    "Fadeyi": { price: 3500, speed: "Same Day Delivery" },
    "Festac": { price: 4000, speed: "Same Day Delivery" },
    "Gbagada": { price: 3000, speed: "Same Day Delivery" },
    "Gbagada Phase 1": { price: 3500, speed: "Same Day Delivery" },
    "Ibafo": { price: 6000, speed: "Same Day Delivery" },
    "Iddo": { price: 3500, speed: "Same Day Delivery" },
    "Idi Araba": { price: 3500, speed: "Same Day Delivery" },
    "Idi Iroko": { price: 3500, speed: "Same Day Delivery" },
    "Idimu": { price: 4000, speed: "Same Day Delivery" },
    "Ifako Ijaiye": { price: 3000, speed: "Same Day Delivery" },
    "Igando": { price: 4000, speed: "Same Day Delivery" },
    "Ijegun": { price: 4000, speed: "Same Day Delivery" },
    "Ikeja": { price: 3000, speed: "Same Day Delivery" },
    "Ikeja Airport": { price: 3500, speed: "Same Day Delivery" },
    "Ikate": { price: 4000, speed: "Same Day Delivery" },
    "Ikorodu": { price: 6000, speed: "Same Day Delivery" },
    "Ikosi": { price: 3000, speed: "Same Day Delivery" },
    "Ikota": { price: 4000, speed: "Same Day Delivery" },
    "Ikotun": { price: 4000, speed: "Same Day Delivery" },
    "Ikoyi": { price: 4000, speed: "Same Day Delivery" },
    "Ilasa": { price: 3500, speed: "Same Day Delivery" },
    "Ilasan": { price: 4000, speed: "Same Day Delivery" },
    "Ilasamaja": { price: 3500, speed: "Same Day Delivery" },
    "Ilupeju": { price: 3500, speed: "Same Day Delivery" },
    "Imota": { price: 6000, speed: "Same Day Delivery" },
    "Ipaja": { price: 4000, speed: "Same Day Delivery" },
    "Isheri olofin": { price: 4000, speed: "Same Day Delivery" },
    "Isheri oshun": { price: 4000, speed: "Same Day Delivery" },
    "Isolo": { price: 3500, speed: "Same Day Delivery" },
    "Iyana ipaja": { price: 4000, speed: "Same Day Delivery" },
    "Jakande": { price: 4000, speed: "Same Day Delivery" },
    "Jibowu": { price: 3500, speed: "Same Day Delivery" },
    "Ketu": { price: 3000, speed: "Same Day Delivery" },
    "Kola": { price: 6000, speed: "Same Day Delivery" },
    "Lagos Island": { price: 4000, speed: "Same Day Delivery" },
    "LASU": { price: 6000, speed: "Same Day Delivery" },
    "Lekki 2": { price: 4000, speed: "Same Day Delivery" },
    "Lekkil": { price: 4000, speed: "Same Day Delivery" },
    "LUTH": { price: 3500, speed: "Same Day Delivery" },
    "Magodo": { price: 3000, speed: "Same Day Delivery" },
    "Magodo 1": { price: 3000, speed: "Same Day Delivery" },
    "Mangoro": { price: 3500, speed: "Same Day Delivery" },
    "Marina": { price: 4000, speed: "Same Day Delivery" },
    "Maryland": { price: 3000, speed: "Same Day Delivery" },
    "Meiran": { price: 4000, speed: "Same Day Delivery" },
    "Mile 12": { price: 3000, speed: "Same Day Delivery" },
    "Mile2": { price: 4000, speed: "Same Day Delivery" },
    "Mowe": { price: 6000, speed: "Same Day Delivery" },
    "Mushin": { price: 3500, speed: "Same Day Delivery" },
    "New Garage": { price: 3000, speed: "Same Day Delivery" },
    "Obanikoro": { price: 3500, speed: "Same Day Delivery" },
    "Obawole": { price: 3000, speed: "Same Day Delivery" },
    "Ogba": { price: 3000, speed: "Same Day Delivery" },
    "Ogombo": { price: 5000, speed: "Same Day Delivery" },
    "Ogudu": { price: 3000, speed: "Same Day Delivery" },
    "Ojo": { price: 6000, speed: "Same Day Delivery" },
    "Ojodu": { price: 3000, speed: "Same Day Delivery" },
    "Ojota": { price: 3000, speed: "Same Day Delivery" },
    "Okokomiako": { price: 6000, speed: "Same Day Delivery" },
    "Ologolo": { price: 4000, speed: "Same Day Delivery" },
    "Olowoira": { price: 3000, speed: "Same Day Delivery" },
    "Omole 1": { price: 3000, speed: "Same Day Delivery" },
    "Omole 2": { price: 3000, speed: "Same Day Delivery" },
    "Onipanu": { price: 3500, speed: "Same Day Delivery" },
    "Oniru": { price: 4000, speed: "Same Day Delivery" },
    "Opic": { price: 3500, speed: "Same Day Delivery" },
    "Orchid": { price: 4000, speed: "Same Day Delivery" },
    "Osapa": { price: 4000, speed: "Same Day Delivery" },
    "Oshodi": { price: 3500, speed: "Same Day Delivery" },
    "Oworo": { price: 3000, speed: "Same Day Delivery" },
    "Oyingbo": { price: 3500, speed: "Same Day Delivery" },
    "Palmgrove": { price: 3500, speed: "Same Day Delivery" },
    "Papa Ajao": { price: 3500, speed: "Same Day Delivery" },
    "Pedro": { price: 3500, speed: "Same Day Delivery" },
    "Sango Otta": { price: 6000, speed: "Same Day Delivery" },
    "Sangotedo": { price: 5000, speed: "Same Day Delivery" },
    "Satellite": { price: 4000, speed: "Same Day Delivery" },
    "Shasha": { price: 4000, speed: "Same Day Delivery" },
    "Shibiti": { price: 6000, speed: "Same Day Delivery" },
    "Somolu": { price: 3500, speed: "Same Day Delivery" },
    "Surulere": { price: 3500, speed: "Same Day Delivery" },
    "Tradefair": { price: 6000, speed: "Same Day Delivery" },
    "VGC": { price: 4000, speed: "Same Day Delivery" },
    "Vi": { price: 4000, speed: "Same Day Delivery" },
    "Yaba": { price: 3500, speed: "Same Day Delivery" },

    // 2. LEGACY LOCATIONS (RETAINED)
    "Abule Oja": { price: 3000, speed: "Same Day Delivery" },
    "Akoka": { price: 3000, speed: "Same Day Delivery" },
    "Akute Border": { price: 3000, speed: "Same Day Delivery" },
    "Alaka Estate": { price: 3000, speed: "Same Day Delivery" },
    "Computer Village": { price: 2500, speed: "Same Day Delivery" },
    "Dopemu": { price: 3000, speed: "Same Day Delivery" },
    "Fagba": { price: 3000, speed: "Same Day Delivery" },
    "Iganmu": { price: 3000, speed: "Same Day Delivery" },
    "Ijaiye": { price: 3000, speed: "Same Day Delivery" },
    "Ijesha Surulere": { price: 3000, speed: "Same Day Delivery" },
    "Iju": { price: 3000, speed: "Same Day Delivery" },
    "Ojuelegba": { price: 3000, speed: "Same Day Delivery" },
    "Baruwa": { price: 3000, speed: "24 Hrs Delivery" },
    "Gowon Estate": { price: 3000, speed: "24 Hrs Delivery" },
    "Okota": { price: 3000, speed: "24 Hrs Delivery" },
    "Obalende": { price: 3000, speed: "24 Hrs Delivery" },
    "Osborne Foreshore": { price: 3000, speed: "24 Hrs Delivery" },
    "Abraham Adesanya": { price: 4000, speed: "24 Hrs Delivery" },
    "Ilaje": { price: 4000, speed: "24 Hrs Delivery" },
    "Magboro": { price: 4000, speed: "2-3 Days Delivery" },
    "Ijanikin": { price: 6000, speed: "2-3 Days Delivery" },
    "Lekki Deep Sea Port": { price: 6000, speed: "2-3 Days Delivery" }
};

export const ABUJA_SHIPPING_DATA = {
    "University of Abuja": { price: 3500, speed: "Delivery" },
    "Iddo": { price: 3500, speed: "Delivery" },
    "Gwagwalada": { price: 4000, speed: "Delivery" },
    "Giri": { price: 3500, speed: "Delivery" },
    "Lugbe": { price: 4500, speed: "Delivery" },
    "Wuse": { price: 5000, speed: "Delivery" },
    "Jabi": { price: 5000, speed: "Delivery" },
    "Utako": { price: 5000, speed: "Delivery" },
    "Maitama": { price: 5000, speed: "Delivery" },
    "Asokoro": { price: 6000, speed: "Delivery" },
    "Guzape": { price: 6000, speed: "Delivery" },
    "Kubwa": { price: 5000, speed: "Delivery" },
    "Gwarinpa": { price: 5000, speed: "Delivery" },
    "Dawaki": { price: 5000, speed: "Delivery" },
    "Katampe": { price: 5000, speed: "Delivery" },
    "Apo": { price: 5000, speed: "Delivery" },
    "Lokogoma": { price: 5000, speed: "Delivery" },
    "Galadimawa": { price: 5000, speed: "Delivery" },
    "Gaduwa": { price: 5000, speed: "Delivery" },
    "Garki": { price: 5000, speed: "Delivery" },
    "Durumi": { price: 5000, speed: "Delivery" },
    "Kuje": { price: 5000, speed: "Delivery" }
};

// INTERSTATE — 2026 RATE CARD (Out of Lagos)
// South West ₦6,500 | South East ₦8,500 | South South ₦8,500 (Akwa Ibom /
// Cross River ₦9,500) | North Central / North West / North East ₦10,000
export const INTERSTATE_SHIPPING_DATA = {
    // SOUTH WEST
    "Ekiti": { home: 6500, park: 6500 },
    "Ondo": { home: 6500, park: 6500 },
    "Osun": { home: 6500, park: 6500 },
    "Oyo": { home: 6500, park: 6500 },
    "Ogun": { home: 6500, park: 6500 },

    // SOUTH EAST
    "Enugu": { home: 8500, park: 8500 },
    "Anambra": { home: 8500, park: 8500 },
    "Ebonyi": { home: 8500, park: 8500 },
    "Imo": { home: 8500, park: 8500 },
    "Abia": { home: 8500, park: 8500 },

    // SOUTH SOUTH
    "Akwa Ibom": { home: 9500, park: 9500 },
    "Cross River": { home: 9500, park: 9500 },
    "Bayelsa": { home: 8500, park: 8500 },
    "Rivers": { home: 8500, park: 8500 },
    "Delta": { home: 8500, park: 8500 },
    "Edo": { home: 8500, park: 8500 },

    // NORTH CENTRAL (Abuja handled separately via ABUJA_SHIPPING_DATA)
    "Niger": { home: 10000, park: 10000 },
    "Benue": { home: 10000, park: 10000 },
    "Nasarawa": { home: 10000, park: 10000 },
    "Plateau": { home: 10000, park: 10000 },
    "Kogi": { home: 10000, park: 10000 },
    "Kwara": { home: 10000, park: 10000 },

    // NORTH WEST
    "Jigawa": { home: 10000, park: 10000 },
    "Kano": { home: 10000, park: 10000 },
    "Katsina": { home: 10000, park: 10000 },
    "Kaduna": { home: 10000, park: 10000 },
    "Kebbi": { home: 10000, park: 10000 },
    "Zamfara": { home: 10000, park: 10000 },
    "Sokoto": { home: 10000, park: 10000 },

    // NORTH EAST
    "Gombe": { home: 10000, park: 10000 },
    "Bauchi": { home: 10000, park: 10000 },
    "Yobe": { home: 10000, park: 10000 },
    "Borno": { home: 10000, park: 10000 },
    "Adamawa": { home: 10000, park: 10000 },
    "Taraba": { home: 10000, park: 10000 }
};

// ----------------------------------------------------------------------------
// ZONE / REGION GROUPINGS — used by the admin Shipping Rates editor for
// grouped (bulk) editing. Each area/state is listed under exactly one group.
// ----------------------------------------------------------------------------

export const LAGOS_ZONES = [
    {
        id: "mainland-a",
        name: "Mainland Zone A",
        price: 3000,
        areas: [
            "Alapere", "Gbagada", "Ifako Ijaiye", "Ikeja", "Ikosi", "Ketu",
            "Magodo", "Magodo 1", "Maryland", "Mile 12", "New Garage", "Obawole",
            "Ogba", "Ogudu", "Ojota", "Ojodu", "Olowoira", "Omole 1", "Omole 2", "Oworo"
        ]
    },
    {
        id: "mainland-b",
        name: "Mainland Zone B",
        price: 3500,
        areas: [
            "Anthony", "Idi Araba", "Idi Iroko", "Obanikoro", "Somolu", "Yaba",
            "Surulere", "Pedro", "Gbagada Phase 1", "Bariga", "Isolo", "Ajao Estate",
            "Ikeja Airport", "Ago palace", "Costain", "Ebute Metta", "Jibowu",
            "Fadeyi", "Mushin", "Ilupeju", "Ilasamaja", "Ilasa", "Iddo", "Cement",
            "LUTH", "Mangoro", "Opic", "Papa Ajao", "Palmgrove", "Oshodi",
            "Oyingbo", "Onipanu"
        ]
    },
    {
        id: "mainland-c",
        name: "Mainland Zone C",
        price: 4000,
        areas: [
            "Abuleegba", "Agege", "Ajegunle", "Akowonjo", "Alaguntan", "Alimosho",
            "Amuwo", "Apapa", "Ayobo", "Egbeda", "Ejigbo", "Festac", "Idimu",
            "Igando", "Ijegun", "Ikotun", "Isheri oshun", "Isheri olofin",
            "Ipaja", "Iyana ipaja", "Meiran", "Mile2", "Shasha", "Satellite"
        ]
    },
    {
        id: "island-a",
        name: "Island Zone A",
        price: 4000,
        areas: [
            "Ikate", "Ikoyi", "Ilasan", "Jakande", "Lagos Island", "Marina",
            "Oniru", "Vi", "Osapa"
        ]
    },
    {
        id: "island-b",
        name: "Island Zone B",
        price: 4000,
        areas: [
            "Agungi", "Chevron", "Ikota", "Lekki 2", "Lekkil", "Ologolo", "Orchid", "VGC"
        ]
    },
    {
        id: "island-c",
        name: "Island Zone C",
        price: 5000,
        areas: [
            "Abijo", "Ajah", "Awoyaya", "Badore", "Ogombo", "Sangotedo"
        ]
    },
    {
        id: "extreme-lagos",
        name: "Extreme Lagos",
        price: 6000,
        areas: [
            "Abule Ado", "Agbara", "Akute", "Alaagbado", "Araga", "Arepo", "Asese",
            "Badagry", "Dangote Refinery", "Epe Ibeju", "Ikorodu", "Ibafo", "Imota",
            "Kola", "LASU", "Mowe", "Ojo", "Okokomiako", "Sango Otta", "Shibiti",
            "Tradefair"
        ]
    },
    {
        id: "other",
        name: "Other / Legacy Areas",
        price: null,
        areas: [
            "Abule Oja", "Akoka", "Akute Border", "Alaka Estate", "Computer Village",
            "Dopemu", "Fagba", "Iganmu", "Ijaiye", "Ijesha Surulere", "Iju",
            "Ojuelegba", "Baruwa", "Gowon Estate", "Okota", "Obalende",
            "Osborne Foreshore", "Abraham Adesanya", "Ilaje", "Magboro", "Ijanikin",
            "Lekki Deep Sea Port"
        ]
    }
];

export const INTERSTATE_REGIONS = [
    {
        id: "south-west",
        name: "South West",
        price: 6500,
        states: ["Ekiti", "Ondo", "Osun", "Oyo", "Ogun"]
    },
    {
        id: "south-east",
        name: "South East",
        price: 8500,
        states: ["Enugu", "Anambra", "Ebonyi", "Imo", "Abia"]
    },
    {
        id: "south-south",
        name: "South South",
        price: 8500,
        states: ["Akwa Ibom", "Cross River", "Bayelsa", "Rivers", "Delta", "Edo"]
    },
    {
        id: "north-central",
        name: "North Central",
        price: 10000,
        states: ["Niger", "Benue", "Nasarawa", "Plateau", "Kogi", "Kwara"]
    },
    {
        id: "north-west",
        name: "North West",
        price: 10000,
        states: ["Jigawa", "Kano", "Katsina", "Kaduna", "Kebbi", "Zamfara", "Sokoto"]
    },
    {
        id: "north-east",
        name: "North East",
        price: 10000,
        states: ["Gombe", "Bauchi", "Yobe", "Borno", "Adamawa", "Taraba"]
    }
];

// The shape persisted to Firestore (settings.site_config.shipping_rates).
// Only *changed* values are written; everything else falls back to the base
// prices above.
export const EMPTY_SHIPPING_RATES = {
    lagos: {},
    abuja: {},
    interstate: {}
};
