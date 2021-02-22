import UiKit from "uikit";
import moment from "moment";
import {headers, urls} from "./http";

const cards = document.getElementById("cards");
const cardHotel = document.getElementById("cardHotel");
let globalParams = {};

const convertObjToQueryString = (obj = {}) => {
    var str = "";
    for (var key in obj) {
        if (str != "") {
            str += "&";
        }
        str += key + "=" + obj[key];
    }
    return str;
}

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

const getSearchNearby = async (params = {}) => {
    try {
        params.checkIn = params.checkIn || moment().add(10, 'days').format("YYYY-MM-DD");
        params.checkOut = params.checkOut || moment().add(12, 'days').format("YYYY-MM-DD");
        params.locale = params.locale || 'en_US';
        params.rooms = params.rooms || 1;
        params.currency = params.currency || 'USD';
        params.pageNumber = params.pageNumber || 1;

        globalParams = params;
        await sleep(1000)
        //const res = await fetch("https://hotels-com-free.p.rapidapi.com/srle/listing/v1/brands/hotels.com?checkIn=2021-01-27&checkOut=2021-01-28&lat=37.788719679657554&lon=-122.40057774847898&locale=en_US&rooms=1&currency=USD&pageNumber=2", {
        const res = await fetch(`${urls.hotels_search_nearby}?${convertObjToQueryString(params)}`, {
            "method": "GET",
            "headers": headers.hotels_headers
        });
        const parsedRes = await res.json();
        return parsedRes;
    } catch (error) {
        console.log(error);
        //UiKit.notify({message: error, status: "danger"});
    }
    ;
}

const getDetails = async (hotelID = 0, params = {}) => {
    try {
        if (params.checkIn) {
            params.checkIn = params.checkIn;
        } else {
            params.checkIn = globalParams.checkIn || moment().add(10, 'days').format("YYYY-MM-DD");
        }
        if (params.checkOut) {
            params.checkOut = params.checkOut;
        } else {
            params.checkOut = globalParams.checkOut || moment().add(12, 'days').format("YYYY-MM-DD");
        }
        params.locale = params.locale || 'en_US';
        if (params.rooms) {
            params.rooms = params.rooms;
        } else {
            params.checkIn = globalParams.rooms || 1;
        }
        params.currency = params.currency || 'USD';
        params.include = params.include || 'neighborhood';

        delete params.lat;
        delete params.lon;
        delete params.pageNumber;
        delete params.hotel_id;
        await sleep(1000)
        //const res = await fetch("https://hotels-com-free.p.rapidapi.com/pde/property-details/v1/hotels.com/106346?checkIn=2021-01-27&locale=en_US&rooms=1&checkOut=2021-01-28&currency=USD&include=neighborhood", {
        const res = await fetch(`${urls.hotels_details}/${hotelID}?${convertObjToQueryString(params)}`, {
            "method": "GET",
            "headers": headers.hotels_headers
        });
        let parsedRes = await res.json();
        if (parsedRes.result == "OK") {
            let reviewsRes = await getDetailsReviews(hotelID);
            let reviews = null;
            if (reviewsRes.result == 'OK') {
                reviews = reviewsRes.reviewData;
            }
            parsedRes.reviews = reviews;
            parsedRes.images = await getDetailsImages(hotelID);
        }

        console.log(parsedRes);
        return parsedRes;
    } catch (error) {
        console.log(error);
        //UiKit.notify({message: error, status: "danger"});
    }
}

const getDetailsReviews = async (hotelID = 0, params = {}) => {
    try {
        params.hotel_id = params.hotel_id || 0;
        params.loc = params.loc || 'en_US';
        params.page = params.page || 1;
        await sleep(1000)
        //const res = await fetch("https://hotels-com-free.p.rapidapi.com/mobile_service/property-content/v1/hotels.com/property/485312/reviews?loc=en_US&page=1", {
        const res = await fetch(`${urls.hotels_details_reviews}/${hotelID}/reviews/?${convertObjToQueryString(params)}`, {
            "method": "GET",
            "headers": headers.hotels_headers
        });
        const parsedRes = await res.json();
        console.log(parsedRes);
        return parsedRes;
    } catch (error) {
        console.log(error);
        //UiKit.notify({message: error, status: "danger"});
    }
}

const getDetailsImages = async (hotelID = 0) => {
    try {
        await sleep(1500)
        //const res = await fetch("https://hotels-com-free.p.rapidapi.com/nice/image-catalog/v2/hotels/106346", {
        const res = await fetch(`${urls.hotels_details_images}/${hotelID}`, {
            "method": "GET",
            "headers": headers.hotels_headers
        });
        const parsedRes = await res.json();
        console.log(parsedRes);
        return parsedRes;
    } catch (error) {
        console.log(error);
        //UiKit.notify({message: error, status: "danger"});
    }
}

const getPlaceInfo = async (q) => {
    try {
        const res = await fetch(`${urls.place_info}&q=${q}`);
        const parsedRes = await res.json();
        return parsedRes.shift();
    } catch (error) {
        console.log(error);
        UiKit.notify({message: "Address not found.", status: "danger"});
    }
};

const getUnsplashImages = async (q) => {
    try {
        const res = await fetch(`${urls.unsplash_images}&query=${q}`);
        const parsedRes = await res.json();
        console.log('getUnsplashImages', parsedRes);
        return parsedRes;
    } catch (error) {
        console.log(error);
        UiKit.notify({message: "Images not found.", status: "danger"});
    }
};

const links = () => {
    [].forEach.call(document.querySelectorAll('.details-btn'), function (el) {
        el.addEventListener('click', async function (e) {
            e.preventDefault();
            loadingStart();
            const targetElement = e.target || e.srcElement;
            const hotelID = targetElement.getAttribute('data-hotel-id');
            const data = await getDetails(hotelID);
            renderHotelCard(data);
            scrollTo(cardHotel);
            loadingEnd();
        })
    });
};

const scrollTo = (el) => {
    window.scroll({top: el.offsetTop, left: 0, behavior: 'smooth'});
}
const renderMap = (data = [], allItems = false) => {
    document.querySelector('#map').style.display = 'block';

    let locations = data.map(({name: title, coordinate}) => {
        return {
            title: title,
            lat: coordinate.lat,
            lon: coordinate.lon,
        }
    });

    let bounds = new google.maps.LatLngBounds();
    let map = new google.maps.Map(document.getElementById('map'), {
        zoom: 10,
        center: new google.maps.LatLng(-33.92, 151.25),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    let infowindow = new google.maps.InfoWindow();

    let marker, i;

    for (i = 0; i < locations.length; i++) {
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(locations[i].lat, locations[i].lon),
            map: map
        });
        bounds.extend(marker.position);
        google.maps.event.addListener(marker, 'click', (function(marker, i) {
            return function() {
                infowindow.setContent(locations[i].title);
                infowindow.open(map, marker);
            }
        })(marker, i));
    }
    map.fitBounds(bounds);

    console.log('render_map_data', data);
}
const hideMap = () => {
    document.querySelector('#map').style.display = 'none';
}
const hidePagination = () => {
    document.querySelector('.uk-pagination').style.display = 'none';
}
const hideForm = () => {
    document.querySelector('#form').style.display = 'none';
}
const hideCards = () => {
    document.querySelector('#cards').style.display = 'none';
}
const showMap = () => {
    document.querySelector('#map').style.display = 'block';
}
const showPagination = () => {
    document.querySelector('.uk-pagination').style.display = 'flex';
}
const showForm = () => {
    document.querySelector('#form').style.display = 'inline-block';
}
const showCards = () => {
    document.querySelector('#cards').style.display = 'flex';
}
const renderCards = (data = [], allItems = false) => {

    if (data.result == 'OK') {
        hideMap();
        if (data.data.body.searchResults.results.length) {
            cards.innerHTML = data.data.body.searchResults.results
                .map(({name: title, thumbnailUrl: thumb, neighbourhood: neighbourhood, id: id}) => {
                    return `
          <div>
            <div class="uk-card uk-card-default uk-height-viewport="expand: true"">
              <div class="uk-card-media-top uk-text-center">
                <img data-src="${thumb}" data-width="1000" data-height="500" width="100%" alt="UIkit cards" uk-img>
              </div>
              <div class="uk-card-body uk-text-center">
                <h3 class="uk-card-title">${title} (${neighbourhood})</h3>
              </div>
              <div class="uk-card-footer uk-text-center">
                <a class="uk-button uk-button-default details-btn" data-hotel-id="${id}" href="#">Details</a>
              </div>
            </div>
          </div>`;
                })
                .join("");
            data.data.body.searchResults.totalCount = +data.data.body.searchResults.totalCount;
            console.log(data.data.body.searchResults.totalCount);
            if (!allItems && data.data.body.searchResults.totalCount > 2) {
                buidPagination({
                    items: data.data.body.searchResults.totalCount,
                    itemsOnPage: 10,
                    displayedPages: 3,
                    currentPage: globalParams.pageNumber
                });
            }
            links();
            renderMap(data.data.body.searchResults.results);
        }
    } else {
        cards.innerHTML = `
    <div class="uk-alert-danger uk-width-1-1" uk-alert>
      <a class="uk-alert-close" uk-close></a>
      <p>${data.error_message}</p>
    </div>`;
    }
};

const hideAllExceptHotelCard = () => {
    hideMap();
    hidePagination();
    hideForm();
    hideCards();
};
const showAllExceptHotelCard = () => {
    showMap();
    showPagination();
    showForm();
    showCards();
    scrollTo(cards);
    clearHotelCard();
};

const loadingStart = () => {
    document.querySelector('#loading-full').style.display = 'flex';
}

const loadingEnd = () => {
    document.querySelector('#loading-full').style.display = 'none';
}
loadingEnd();

const renderHotelCard = (data = []) => {
    hideAllExceptHotelCard();
    if (data.result == 'OK') {
        let hotelInfo = prepareHotelInfo(data);

        let html = '';
        let htmlParts = {
            reviews: '',
            images: '',
            atAGlance: '',
        };
        if (hotelInfo.images.length) {
            htmlParts.images += '<div class="uk-width-1-2">';
            htmlParts.images += '<b>Photos</b>';
            htmlParts.images += '<div class="slider slider-for">';
            hotelInfo.images.forEach(image => {
                htmlParts.images += `<div><img src="${image.url}" alt=""></div>`;
            });
            htmlParts.images += '</div>';
            htmlParts.images += '<div class="slider slider-nav">';
            hotelInfo.images.forEach(image => {
                htmlParts.images += `<div><img src="${image.url}" alt=""></div>`;
            });
            htmlParts.images += '</div></div>';
        }
        if (hotelInfo.atAGlance) {
            htmlParts.atAGlance += `<div class="uk-width-1-2" style="padding-left: 20px;">`;
            htmlParts.atAGlance += `<b>Info:</b>`;
            htmlParts.atAGlance += `<ul uk-accordion>`;
            if (hotelInfo.atAGlance.keyFacts.hotelSize != undefined) {
                htmlParts.atAGlance += `
                <li class="open">
                    <a class="uk-accordion-title" href="#">Hotel Size</a>
                    <div class="uk-accordion-content">${hotelInfo.atAGlance.keyFacts.hotelSize.join(' <br> ')}`;
                htmlParts.atAGlance += `</div></li>`;
            }
            if (hotelInfo.atAGlance.keyFacts.arrivingLeaving != undefined) {
                htmlParts.atAGlance += `
                <li class="">
                    <a class="uk-accordion-title" href="#">Hotel Arriving Leaving</a>
                    <div class="uk-accordion-content">${hotelInfo.atAGlance.keyFacts.arrivingLeaving.join(' <br> ')}`;
                htmlParts.atAGlance += `</div></li>`;
            }
            if (hotelInfo.atAGlance.keyFacts.specialCheckInInstructions != undefined) {
                htmlParts.atAGlance += `
                <li class="">
                    <a class="uk-accordion-title" href="#">Hotel CheckIn Instructions</a>
                    <div class="uk-accordion-content">${hotelInfo.atAGlance.keyFacts.specialCheckInInstructions.join(' <br> ')}`;
                htmlParts.atAGlance += `</div></li>`;
            }
            if (hotelInfo.atAGlance.keyFacts.requiredAtCheckIn != undefined) {
                htmlParts.atAGlance += `
                <li class="">
                    <a class="uk-accordion-title" href="#">Hotel Required At CheckIn</a>
                    <div class="uk-accordion-content">${hotelInfo.atAGlance.keyFacts.requiredAtCheckIn.join(' <br> ')}`;
                htmlParts.atAGlance += `</div></li>`;
            }
            if (hotelInfo.atAGlance.travellingOrInternet.travelling.children != undefined) {
                htmlParts.atAGlance += `
                <li class="">
                    <a class="uk-accordion-title" href="#">Children</a>
                    <div class="uk-accordion-content">${hotelInfo.atAGlance.travellingOrInternet.travelling.children.join(' <br> ')}`;
                htmlParts.atAGlance += `</div></li>`;
            }
            if (hotelInfo.atAGlance.travellingOrInternet.travelling.pets != undefined) {
                htmlParts.atAGlance += `
                <li class="">
                    <a class="uk-accordion-title" href="#">Pets</a>
                    <div class="uk-accordion-content">${hotelInfo.atAGlance.travellingOrInternet.travelling.pets.join(' <br> ')}`;
                htmlParts.atAGlance += `</div></li>`;
            }
            if (hotelInfo.atAGlance.travellingOrInternet.internet != undefined) {
                htmlParts.atAGlance += `
                <li class="">
                    <a class="uk-accordion-title" href="#">Internet</a>
                    <div class="uk-accordion-content">${hotelInfo.atAGlance.travellingOrInternet.internet.join(' <br> ')}`;
                htmlParts.atAGlance += `</div></li>`;
            }

            htmlParts.atAGlance += `</ul></div>`;
            console.log(htmlParts.atAGlance);
        }
        console.log('test');
        html = `
          <div class="uk-flex uk-flex-center">
            <div class="uk-card uk-card-default  uk-width-1-1@m uk-width-1-1">
              <button class="uk-button uk-button-primary back-to-list back-to-list-fixed">Back to search</button>
              <div class="uk-card-media-top uk-text-center">
                <img data-src="${hotelInfo.image}" data-width="1000" data-height="500" width="100%" alt="UIkit cards" uk-img>
              </div>
              <div class="uk-card-body uk-text-left">
                <h3 class="uk-card-title uk-text-center">${hotelInfo.title} (${hotelInfo.neighbourhood})</h3>
                <div>${hotelInfo.welcomeText}</div>
                <dl class="uk-description-list uk-description-list-divider">
                    <dt>Address:</dt><dd>${hotelInfo.address}</dd>
                    <dt>Rating:</dt><dd>${hotelInfo.raiting}</dd>
                    <dt>Price:</dt><dd>${hotelInfo.price}</dd>
                    <dt>Room Types:</dt><dd>${hotelInfo.roomTypeNames}</dd>
                </dl>
                <div class="uk-flex uk-flex-center">
                    ${htmlParts.images}
                    ${htmlParts.atAGlance}
                </div>
                ${htmlParts.reviews}
              </div>
            </div>
          </div>`;
        cardHotel.innerHTML = html;
        if (hotelInfo.images.length) {
            $('.slider-for').slick({
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false,
                fade: true,
                asNavFor: '.slider-nav'
            });
            $('.slider-nav').slick({
                slidesToShow: 3,
                slidesToScroll: 1,
                asNavFor: '.slider-for',
                dots: false,
                centerMode: true,
                focusOnSelect: true
            });
        }
        [].forEach.call(document.querySelectorAll('.back-to-list'), function (el) {
            el.addEventListener('click', async function (e) {
                e.preventDefault();
                showAllExceptHotelCard();
            })
        });
    } else {
        cardHotel.innerHTML = `
    <div class="uk-alert-danger uk-width-1-1" uk-alert>
      <a class="uk-alert-close" uk-close></a>
      <p>${data.error_message}</p>
    </div>`;
    }
};
const prepareHotelInfo = (data) => {
    let hotelInfo = {
        title: '',
        neighbourhood: '',
        address: '',
        raiting: '',
        image: '',
        price: '',
        roomTypeNames: '',
        welcomeText: '',
        badge: '',
        trustYouReviews: '-',
        images: [],
        reviews: [],
        rooms: [],
        amenities: [],
        overview: [],
    };
    if (typeof data.data.body.propertyDescription.name != 'undefined') {
        hotelInfo.title = data.data.body.propertyDescription.name;
    }
    if (typeof data.neighborhood.neighborhoodName != 'undefined') {
        hotelInfo.neighbourhood = data.neighborhood.neighborhoodName;
    } else if (typeof data.data.body.propertyDescription.address.cityName != 'undefined') {
        hotelInfo.neighbourhood = data.data.body.propertyDescription.address.cityName;
    }
    if (typeof data.data.body.propertyDescription.address != 'undefined') {
        hotelInfo.address = `${data.data.body.propertyDescription.address.fullAddress}`;
    }
    if (typeof data.data.body.propertyDescription.starRatingTitle != 'undefined') {
        hotelInfo.raiting = data.data.body.propertyDescription.starRatingTitle;
    }
    if (typeof data.images.hotelImages[0].baseUrl != 'undefined') {
        hotelInfo.image = data.images.hotelImages[0].baseUrl.replace('{size}', 'z');
    }
    if (typeof data.data.body.propertyDescription.featuredPrice.currentPrice.formatted != 'undefined') {
        hotelInfo.price = `${data.data.body.propertyDescription.featuredPrice.currentPrice.formatted} - ${data.data.body.propertyDescription.featuredPrice.priceInfo} - ${data.data.body.propertyDescription.featuredPrice.totalPricePerStay}`;
    }
    if (typeof data.data.body.propertyDescription.mapWidget.staticMapUrl != 'undefined') {
        hotelInfo.mapWidget = `${data.data.body.propertyDescription.mapWidget.staticMapUrl}`;
    }
    if (typeof data.data.body.propertyDescription.roomTypeNames != 'undefined') {
        hotelInfo.roomTypeNames = data.data.body.propertyDescription.roomTypeNames.filter(function(item) {
            return item ? true : false;
        }).join(', ');
    }
    if (typeof data.data.body.hotelWelcomeRewards.info != 'undefined') {
        hotelInfo.welcomeText = data.data.body.hotelWelcomeRewards.info;
    }
    if (typeof data.data.body.hotelBadge != 'undefined') {
        hotelInfo.badge = data.data.body.hotelBadge.label;
    }
    if (typeof data.data.body.guestReviews.trustYouReviews != 'undefined') {
        /*hotelInfo.trustYouReviews = data.data.body.guestReviews.trustYouReviews
            .map(({categoryName, percentage, text}) => {
                return {
                    categoryName: categoryName,
                    percentage: percentage,
                    text: text,
                }
            });*/
    }
    if (typeof data.reviews.guestReviewGroups.guestReviews[0].reviews != 'undefined') {
        hotelInfo.reviews = data.reviews.guestReviewGroups.guestReviews[0].reviews;
    }
    if (typeof data.data.body.roomsAndRates.rooms != 'undefined') {
        hotelInfo.rooms = data.data.body.roomsAndRates.rooms;
    }
    if (typeof data.images.hotelImages != 'undefined') {
        hotelInfo.images = data.images.hotelImages;
        if (hotelInfo.images.length) {
            hotelInfo.images = hotelInfo.images.map(({baseUrl, sizes}) => {
                return {
                    url: baseUrl.replace('{size}', 'z'),
                    baseUrl: baseUrl,
                    sizes: sizes,
                }
            });

        }
    }
    if (typeof data.data.body.amenities != 'undefined') {
        hotelInfo.amenities = data.data.body.amenities;
    }
    if (typeof data.data.body.atAGlance != 'undefined') {
        hotelInfo.atAGlance = data.data.body.atAGlance;
    }

    console.log('hotelInfo', hotelInfo);
    return hotelInfo;
}
const clearHotelCard = () => {
    const element = document.querySelector('#cardHotel');
    element.innerHTML = "";
}
const buidPagination = (data = {}) => {
    if (data.currentPage > 0) data.currentPage--;
    const paginationElement = document.querySelector('.uk-pagination');
    const pagination = UIkit.pagination(paginationElement, data);
    $('.uk-pagination').on('select.uk.pagination', async function (e, pageIndex) {
        globalParams.pageNumber = (pageIndex + 1);
        await paginate(globalParams);
    });
}
const clearPagination = () => {
    const paginationElement = document.querySelector('.uk-pagination');
    paginationElement.remove();
    let el = document.createElement("ul");
    el.setAttribute('class', 'uk-pagination');
    el.innerHTML = "";
    insertAfter(cards, el);
}
const insertAfter = (referenceNode, newNode) => {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}
const paginate = async (params = {}) => {
    loadingStart();
    clearHotelCard();
    const data = await getSearchNearby(params);
    renderCards(data);
    loadingEnd();
}
const getRandomIntInclusive = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const setRandBg = () => {
    let rand = getRandomIntInclusive(1, 11);
    let element = document.querySelector("body");
    element.className = "";
    element.classList.add(`bg${rand}`);
}
const updateBg = () => {
    setRandBg();
    const playlistEditing = setInterval(function () {
        setRandBg();
    }, 1000 * 10);
}

document.addEventListener("DOMContentLoaded", async () => {
    /*
    let dataAddress = 'Lviv';
    let dataAddressInfo = await getPlaceInfo(dataAddress);
    console.log(dataAddressInfo);
    let params = {
        lat: dataAddressInfo.lat,
        lon: dataAddressInfo.lon,
        checkIn: moment().add(1, 'days').format("YYYY-MM-DD"),
        checkOut: moment().add(10, 'days').format("YYYY-MM-DD"),
        rooms: 1,
        pageNumber: 1,
    };
    let searchNearbyResults = await getSearchNearby(params);
    console.log(searchNearbyResults);
    let hotelID = '757219776';
    let detailHotel = await getDetails(hotelID, params);
    console.log(detailHotel);
    let detailHotelReviews = await getDetailsReviews(hotelID);
    console.log(detailHotelReviews);
    let detailHotelImages = await getDetailsImages(hotelID);
    console.log(detailHotelImages);
    return;
    */

    updateBg();
    const form = document.getElementById("form");
    if (form && form.length) {
        if (document.querySelector("[name='check_in']")) {
            document.querySelector("[name='check_in']").value = moment().add(10, 'days').format("YYYY-MM-DD");
        }
        if (document.querySelector("[name='check_out']")) {
            document.querySelector("[name='check_out']").value = moment().add(12, 'days').format("YYYY-MM-DD");
        }
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            try {
                let queryText = document.querySelector("[name='title']").value;
                let queryCheckIn = document.querySelector("[name='check_in']").value;
                let queryCheckOut = document.querySelector("[name='check_out']").value;
                let queryRooms = document.querySelector("[name='rooms']").value;
                console.log(queryText, queryRooms);
                if (!queryText) {
                    return;
                }
                let dataAddressInfo = await getPlaceInfo(queryText);
                if (!dataAddressInfo) {
                    return;
                }
                loadingStart();
                clearPagination();
                clearHotelCard();
                let params = {
                    lat: dataAddressInfo.lat,
                    lon: dataAddressInfo.lon,
                    // lat: 1,
                    // lon: -1,
                    checkIn: moment(queryCheckIn).format("YYYY-MM-DD"),
                    checkOut: moment(queryCheckOut).format("YYYY-MM-DD"),
                    rooms: queryRooms || 1,
                    pageNumber: 1,
                };
                const data = await getSearchNearby(params);
                renderCards(data);
                loadingEnd();
                return;
            } catch (error) {
                console.log(error);
                UIkit.notify({message: error, status: "danger"});
            }
        });
    }
});
