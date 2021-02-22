const BASE_URL = "https://www.omdbapi.com";
const api_key = 'fa5a9961';

const PLACE_URL = "https://us1.locationiq.com/v1/search.php";
const place_api_key = "pk.8abf2bed23931624b1c56652a88f7dbc";

const HOTELS_BASE_URL = "https://hotels-com-free.p.rapidapi.com";
const HOTELS_HEADERS = {
    "x-rapidapi-keys": [
        "4debea6015msh9c562157b23b19bp1df6d5jsn193d72d2296f",
        "d6d98779c4msh39577c5f567858fp122552jsn391453a39028",
        "4281f2dbd4mshc771c4185d5c03cp1257b7jsn4c9c48725c95",
        "7b39bda84emsh5e805517d4b6d51p13f611jsn6cf4b9e21ddc",
        "f79f98a041msh1def5d5596ee87dp152fafjsn22e7a5e7e336",
    ],
    "x-rapidapi-key": "4debea6015msh9c562157b23b19bp1df6d5jsn193d72d2296f",
    "x-rapidapi-host": "hotels-com-free.p.rapidapi.com",
};

const UNSPLASH_IMAGES_BASE_URL = "https://api.unsplash.com/search/photos";
const unsplash_images_api_key = "Ks4FI-9PC1RYj7uc3MYdmBKaJi1zMQu_Lb1gTgf1Vxs";

const urls = {
    search: `${BASE_URL}/?apikey=${api_key}`,
    place_info: `${PLACE_URL}/?key=${place_api_key}&format=json`,
    hotels_search_nearby: `${HOTELS_BASE_URL}/srle/listing/v1/brands/hotels.com`,
    hotels_details: `${HOTELS_BASE_URL}/pde/property-details/v1/hotels.com`,
    hotels_details_reviews: `${HOTELS_BASE_URL}/mobile_service/property-content/v1/hotels.com/property`,
    hotels_details_images: `${HOTELS_BASE_URL}/nice/image-catalog/v2/hotels`,
    unsplash_images: `${UNSPLASH_IMAGES_BASE_URL}?client_id=${unsplash_images_api_key}`,
};

const headers = {
    hotels_headers: HOTELS_HEADERS,
};

export {BASE_URL, urls, headers};


