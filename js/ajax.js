import UiKit from "uikit";
import moment from "moment";
import {headers, urls} from "./http";

const cards = document.getElementById("cards");
const cardHotel = document.getElementById("cardHotel");
const map = document.getElementById("map");
let globalParams = {};

const convertObjToQueryString = (obj = {}) => {
    var str = "";
    for(var key in obj){
        if(str != ""){
            str += "&";
        }
        str += key + "=" + obj[key];
    }
    return str;
}

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))

const prepareHeaders = (headersData) => {
    let headers = {
        "x-rapidapi-key": headersData["x-rapidapi-key"],
        "x-rapidapi-host": headersData["x-rapidapi-host"],
    };
    if (localStorage.getItem('rapidapi-key')) {
        headers = {
            "x-rapidapi-key": localStorage.getItem('rapidapi-key'),
        };
    } else {
        localStorage.setItem('rapidapi-key', headersData["x-rapidapi-key"]);
    }
    console.log(headers);
    return headers;
}

const updateHeadersData = (callback = null) => {
    let generalHeaders = headers.hotels_headers;
    if (localStorage.getItem('rapidapi-key')) {
        let localStorageKey = localStorage.getItem('rapidapi-key');
        let activeIndex = 0;
        generalHeaders["x-rapidapi-keys"].forEach((key, index) => {
            if (key == localStorageKey) {
                activeIndex = index;
            }
        });
        if (activeIndex < generalHeaders["x-rapidapi-keys"].length) {
            activeIndex++;
        } else {
            activeIndex = 0;
        }
        generalHeaders["x-rapidapi-keys"].forEach((key, index) => {
            if (activeIndex == index) {
                localStorage.setItem('rapidapi-key', key);
            }
        });
    } else {
        localStorage.setItem('rapidapi-key', generalHeaders["x-rapidapi-key"]);
    }
    if (typeof (callback) === 'function') {
        callback();
    }
}

const getSearchNearby = async(params = {}) => {
    try{
        params.checkIn = params.checkIn || moment().add(10, 'days').format("YYYY-MM-DD");
        params.checkOut = params.checkOut || moment().add(12, 'days').format("YYYY-MM-DD");
        params.locale = params.locale || 'en_US';
        params.rooms = params.rooms || 1;
        params.currency = params.currency || 'USD';
        //params.sortOrder = params.sortOrder || 'BEST_SELLER';
        params.pageNumber = params.pageNumber || 1;

        globalParams = params;
        const res = await fetch(`${urls.hotels_search_nearby}?${convertObjToQueryString(params)}`, {
            "method": "GET",
            "headers": prepareHeaders(headers.hotels_headers)
        });
        if (res.status == 429) {
            updateHeadersData(function() {
                getSearchNearby(params);
            });
        }
        const parsedRes = await res.json();
        return parsedRes;
    }catch(error){
        console.log(error);
        UiKit.notify({message: "Error", status: "danger"});
    }
    ;
    console.log('end SearchNearby');
}

const getDetails = async(hotelID = 0, params = {}) => {
    try{
        if(params.checkIn){
            params.checkIn = params.checkIn;
        }else{
            params.checkIn = globalParams.checkIn || moment().add(10, 'days').format("YYYY-MM-DD");
        }
        if(params.checkOut){
            params.checkOut = params.checkOut;
        }else{
            params.checkOut = globalParams.checkOut || moment().add(12, 'days').format("YYYY-MM-DD");
        }
        params.locale = params.locale || 'en_US';
        console.log(params);
        console.log(globalParams);
        if (params.rooms) {
            params.rooms = params.rooms;
        } else {
            params.rooms = globalParams.rooms || 1;
        }
        params.currency = params.currency || 'USD';
        params.include = params.include || 'neighborhood';

        delete params.lat;
        delete params.lon;
        delete params.pageNumber;
        delete params.hotel_id;
        await sleep(1000)
        const res = await fetch(`${urls.hotels_details}/${hotelID}?${convertObjToQueryString(params)}`, {
            "method": "GET",
            "headers": prepareHeaders(headers.hotels_headers)
        });
        if (res.status == 429) {
            updateHeadersData(function() {
                getDetails(hotelID, params);
            });
        }
        let parsedRes = await res.json();
        if(parsedRes.result == "OK"){
            let reviewsRes = await getDetailsReviews(hotelID);
            let reviews = null;
            if(reviewsRes.result == 'OK'){
                reviews = reviewsRes.reviewData;
            }
            parsedRes.reviews = reviews;
            parsedRes.images = await getDetailsImages(hotelID);
        }

        console.log(parsedRes);
        return parsedRes;
    }catch(error){
        console.log(error);
        //UiKit.notify({message: error, status: "danger"});
    }
}

const getDetailsReviews = async(hotelID = 0, params = {}) => {
    try{
        params.hotel_id = params.hotel_id || 0;
        params.loc = params.loc || 'en_US';
        params.page = params.page || 1;
        await sleep(1000)
        const res = await fetch(`${urls.hotels_details_reviews}/${hotelID}/reviews/?${convertObjToQueryString(params)}`, {
            "method": "GET",
            "headers": prepareHeaders(headers.hotels_headers)
        });
        if (res.status == 429) {
            updateHeadersData(function() {
                getDetailsReviews(hotelID, params);
            });
        }
        const parsedRes = await res.json();
        console.log(parsedRes);
        return parsedRes;
    }catch(error){
        console.log(error);
        //UiKit.notify({message: error, status: "danger"});
    }
}

const getDetailsImages = async(hotelID = 0) => {
    try{
        await sleep(1500)
        const res = await fetch(`${urls.hotels_details_images}/${hotelID}`, {
            "method": "GET",
            "headers": prepareHeaders(headers.hotels_headers)
        });
        if (res.status == 429) {
            updateHeadersData(function() {
                getDetailsImages(hotelID);
            });
        }
        const parsedRes = await res.json();
        console.log(parsedRes);
        return parsedRes;
    }catch(error){
        console.log(error);
        //UiKit.notify({message: error, status: "danger"});
    }
}

const getPlaceInfo = async(q) => {
    try{
        const res = await fetch(`${urls.place_info}&q=${q}`);
        const parsedRes = await res.json();
        return parsedRes.shift();
    }catch(error){
        console.log(error);
        UiKit.notify({message: "Address not found.", status: "danger"});
    }
};

const links = () => {
    [].forEach.call(document.querySelectorAll('.details-btn'), function(el){
        el.addEventListener('click', async function(e){
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

    for(i = 0; i < locations.length; i++){
        marker = new google.maps.Marker({
            position: new google.maps.LatLng(locations[i].lat, locations[i].lon),
            map: map
        });
        bounds.extend(marker.position);
        google.maps.event.addListener(marker, 'click', (function(marker, i){
            return function(){
                infowindow.setContent(locations[i].title);
                infowindow.open(map, marker);
            }
        })(marker, i));
    }
    map.fitBounds(bounds);
}
const hideMap = () => {
    document.querySelector('#map').style.display = 'none';
}
const hidePagination = () => {
    document.querySelector('.uk-pagination').style.display = 'none';
}
const hideForm = () => {
    document.querySelector('#form').style.display = 'none';
    document.querySelector('.form-wrapper').style.display = 'none';
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
    document.querySelector('.form-wrapper').style.display = 'flex';
}
const showCards = () => {
    document.querySelector('#cards').style.display = 'flex';
}
const showGeneralContainer = () => {
    document.querySelector('.general-container').classList.add('visible');
}

const renderCards = (data = [], allItems = false) => {
    showGeneralContainer();
    if(data.result == 'OK'){
        hideMap();
        if(data.data.body.searchResults.results.length){
            cards.innerHTML = data.data.body.searchResults.results
                .map(({name: title, optimizedThumbUrls: thumb, neighbourhood: neighbourhood, id: id, ratePlan: ratePlan, roomsLeft: roomsLeft}) => {
                    console.log(ratePlan);
                    if (thumb.srpDesktop) {
                        thumb = thumb.srpDesktop;
                    } else {
                        thumb = '';
                    }
                    let priceInfo = "-";
                    if (ratePlan.price.totalPricePerStay) {
                        priceInfo = ratePlan.price.totalPricePerStay;
                    }
                    if (!roomsLeft) {
                        roomsLeft = '-';
                    }
                    return `
          <div>
            <div class="uk-card uk-card-default uk-height-viewport="expand: true"">
              <div class="uk-card-media-top uk-text-center">
                <img data-src="${thumb}" data-width="1000" data-height="500" width="100%" alt="UIkit cards" uk-img>
              </div>
              <div class="uk-card-body uk-card uk-card-default">
                <h3 class="uk-card-title uk-text-center">${title}</h3>
                <p>
                    District: ${neighbourhood}
                    <br>
                    Price: ${priceInfo}
                    <br>
                    Rooms Left: ${roomsLeft}
                </p>
              </div>
              <div class="uk-card-footer uk-text-center">
                <a class="uk-button uk-button-default details-btn uk-button-primary" data-hotel-id="${id}" href="#">Details</a>
              </div>
            </div>
          </div>`;
                })
                .join("");
            data.data.body.searchResults.totalCount = +data.data.body.searchResults.totalCount;
            console.log(data.data.body.searchResults.totalCount);
            if(!allItems && data.data.body.searchResults.totalCount > 2){
                buildPagination({
                    items: data.data.body.searchResults.totalCount,
                    itemsOnPage: 10,
                    displayedPages: 3,
                    currentPage: globalParams.pageNumber
                });
            }
            links();
            renderMap(data.data.body.searchResults.results);
            scrollTo(map);
        } else {
            cards.innerHTML = `
    <div class="uk-alert-danger uk-width-1-1" uk-alert>
      <a class="uk-alert-close" uk-close></a>
      <p>Records not found.</p>
    </div>`;
        }
    }else{
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
    if(data.result == 'OK'){
        let hotelInfo = prepareHotelInfo(data);

        let html = '';
        let htmlParts = {
            reviews: '',
            images: '',
            atAGlance: '',
            amenities: '',
            rooms: '',
        };
        if(hotelInfo.images.length){
            htmlParts.images += '<div class="uk-width-1-2">';
            htmlParts.images += '<span>PHOTOS:</span>';
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
        if(hotelInfo.atAGlance || hotelInfo.overview.length){
            htmlParts.atAGlance += `<div class="uk-width-1-2" style="padding-left: 20px;">`;
            htmlParts.atAGlance += `<span>INFO:</b>`;
            htmlParts.atAGlance += `<ul uk-accordion>`;
            hotelInfo.overview.forEach(overview => {
                htmlParts.atAGlance += `
                <li class="open">
                    <a class="uk-accordion-title" href="#">${overview.title}</a>
                    <div class="uk-accordion-content">${overview.content.join(' <br> ')}`;
            });
            if(hotelInfo.atAGlance && hotelInfo.atAGlance.keyFacts.hotelSize != undefined){
                htmlParts.atAGlance += `
                <li class="open">
                    <a class="uk-accordion-title" href="#">Hotel Size</a>
                    <div class="uk-accordion-content">${hotelInfo.atAGlance.keyFacts.hotelSize.join(' <br> ')}`;
                htmlParts.atAGlance += `</div></li>`;
            }
            if(hotelInfo.atAGlance && hotelInfo.atAGlance.keyFacts.arrivingLeaving != undefined){
                htmlParts.atAGlance += `
                <li class="">
                    <a class="uk-accordion-title" href="#">Hotel Arriving Leaving</a>
                    <div class="uk-accordion-content">${hotelInfo.atAGlance.keyFacts.arrivingLeaving.join(' <br> ')}`;
                htmlParts.atAGlance += `</div></li>`;
            }
            if(hotelInfo.atAGlance && hotelInfo.atAGlance.keyFacts.specialCheckInInstructions != undefined){
                htmlParts.atAGlance += `
                <li class="">
                    <a class="uk-accordion-title" href="#">Hotel CheckIn Instructions</a>
                    <div class="uk-accordion-content">${hotelInfo.atAGlance.keyFacts.specialCheckInInstructions.join(' <br> ')}`;
                htmlParts.atAGlance += `</div></li>`;
            }
            if(hotelInfo.atAGlance && hotelInfo.atAGlance.keyFacts.requiredAtCheckIn != undefined){
                htmlParts.atAGlance += `
                <li class="">
                    <a class="uk-accordion-title" href="#">Hotel Required At CheckIn</a>
                    <div class="uk-accordion-content">${hotelInfo.atAGlance.keyFacts.requiredAtCheckIn.join(' <br> ')}`;
                htmlParts.atAGlance += `</div></li>`;
            }
            if(hotelInfo.atAGlance && hotelInfo.atAGlance.travellingOrInternet.travelling != undefined && hotelInfo.atAGlance.travellingOrInternet.travelling.children != undefined){
                htmlParts.atAGlance += `
                <li class="">
                    <a class="uk-accordion-title" href="#">Children</a>
                    <div class="uk-accordion-content">${hotelInfo.atAGlance.travellingOrInternet.travelling.children.join(' <br> ')}`;
                htmlParts.atAGlance += `</div></li>`;
            }
            if(hotelInfo.atAGlance && hotelInfo.atAGlance.travellingOrInternet.travelling != undefined && hotelInfo.atAGlance.travellingOrInternet.travelling.pets != undefined){
                htmlParts.atAGlance += `
                <li class="">
                    <a class="uk-accordion-title" href="#">Pets</a>
                    <div class="uk-accordion-content">${hotelInfo.atAGlance.travellingOrInternet.travelling.pets.join(' <br> ')}`;
                htmlParts.atAGlance += `</div></li>`;
            }
            if(hotelInfo.atAGlance && hotelInfo.atAGlance.travellingOrInternet.internet != undefined){
                htmlParts.atAGlance += `
                <li class="">
                    <a class="uk-accordion-title" href="#">Internet</a>
                    <div class="uk-accordion-content">${hotelInfo.atAGlance.travellingOrInternet.internet.join(' <br> ')}`;
                htmlParts.atAGlance += `</div></li>`;
            }

            htmlParts.atAGlance += `</ul></div>`;
        }

        if(hotelInfo.amenities.length){
            htmlParts.amenities += `<ul uk-accordion="multiple: true">`;
            hotelInfo.amenities.forEach(amenity => {
                htmlParts.amenities += `
                <li class="uk-open">
                    <a class="uk-accordion-title" href="#">Amenities ${amenity.heading}</a>
                    <div class="uk-accordion-content uk-margin-medium-top" uk-grid>`;
                if(amenity.listItems.length){
                    amenity.listItems.forEach(list => {
                        htmlParts.amenities += `<div><h4>${list.heading}</h4><ul class="uk-list uk-list-disc uk-list-muted"><li>${list.listItems.join('</li><li>')}</li></ul></div>`;
                    });
                }
                htmlParts.amenities += `</div></li>`;
            });
        }

        if(hotelInfo.rooms.length){
            hotelInfo.rooms.forEach((room, index) => {
                let image = room.images.length && typeof (room.images[0].fullSizeUrl) != 'undefined' ? room.images[0].fullSizeUrl : '';
                if(image) {
                    image = image.replace('_b.', '_z.', image);
                } else {
                    image = hotelInfo.image;
                }
                let bookUrl = `https://hotels.com/ho${hotelInfo.id}/?q-check-out=${globalParams.checkOut}&tab=description&q-check-in=${globalParams.checkIn}`;
                if (room.ratePlans[0].payment.book.bookingParams.roomTypeCode) {
                    bookUrl += `#${room.ratePlans[0].payment.book.bookingParams.roomTypeCode}`;
                } else {
                    bookUrl += `#filter-rooms-and-rates`;
                }
                //add params for book url
                htmlParts.rooms += `<div class="uk-card uk-card-default uk-grid-collapse uk-child-width-1-2@s uk-margin" uk-grid>
                    <div class="${(index % 2 == 1) ? 'uk-card-media-left' : 'uk-flex-last@s uk-card-media-right'} uk-cover-container">
                        <img src="${image}" alt="" uk-cover>
                            <canvas width="600" height="400"></canvas>
                    </div>
                    <div>
                        <div class="uk-card-body">
                            <h3 class="uk-card-title">${room.name}</h3>
                            <p>${room.additionalInfo.description}</p>
                            <a class="uk-button uk-button-primary" href="#modal-full-${index}" uk-toggle>More</a>
                        </div>
                    </div>
                </div> 
                <div id="modal-full-${index}" class="uk-modal-full" uk-modal>
                    <div class="uk-modal-dialog">
                        <button class="uk-modal-close-full uk-close-large" type="button" uk-close></button>
                        <div class="uk-grid-collapse uk-child-width-1-2@s uk-flex-middle" uk-grid>
                            <div class="uk-background-cover" style="background-image: url('${image}');" uk-height-viewport></div>
                            <div class="uk-padding-large">
                                <h1>${room.name}</h1>
                                <h4>${room.maxOccupancy.messageTotal} ${room.maxOccupancy.messageChildren}</h4>
                                <h4>${room.ratePlans[0].price.current} - ${room.ratePlans[0].price.info} - ${room.ratePlans[0].price.totalPricePerStay}</h4>
                                <h5>${room.ratePlans[0].roomsLeft} room left</h5>
                                <a class="uk-button uk-button-danger" href="${bookUrl}" target="_blank">Book Now</a>
                                <h4>${room.ratePlans[0].cancellation.title}</h4>
                                <p>${room.ratePlans[0].cancellation.info}</p>
                                <p>${room.additionalInfo.description}</p>
                            </div>
                        </div>
                    </div>
                </div>`;
            });
        }

        if(hotelInfo.trustYouReviews.length || hotelInfo.reviews.length){
            htmlParts.reviews += `<ul uk-accordion>
                                    <li class="">
                                        <a class="uk-accordion-title" href="#">Reviews</a><div class="uk-accordion-content">`;
            /*htmlParts.reviews += hotelInfo.trustYouReviews
                .map(({categoryName, percentage, text}) => {
                    return `
                  <div class="uk-width-1-4">
                    ${categoryName}: ${percentage} <br> ${text}
                  </div><br>`;
                }).join('');*/
            if(hotelInfo.reviews.length){
                htmlParts.reviews += '<dl class="uk-description-list uk-description-list-divider">';
                hotelInfo.reviews.forEach(review => {
                    htmlParts.reviews += `<dt>${(review.recommendedBy ? review.recommendedBy : 'Unknown')} - ${review.qualitativeBadgeText} ${review.rating}</dt>
                                          <dd>${review.summary}</dd>`;
                });
                htmlParts.reviews += '</dl>';
            }
            htmlParts.reviews += '</div></li></ul>';
        }
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
                <div class="uk-flex uk-flex-center uk-margin-top">
                    <div class="uk-card uk-card-default  uk-width-1@m uk-width-1-1">
                        ${htmlParts.rooms}
                    </div>
                </div>
                ${htmlParts.amenities}
                ${htmlParts.reviews}
              </div>
            </div>
          </div>`;
        cardHotel.innerHTML = html;
        if(hotelInfo.images.length){
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

    }else{
        cardHotel.innerHTML = `
    <div class="uk-alert-danger uk-width-1-1" uk-alert>
      <a class="uk-alert-close" uk-close></a>
      <p>${data.error_message}</p>
    </div>`;
    }
};
const prepareHotelInfo = (data) => {
    let hotelInfo = {
        id: '',
        title: '',
        neighbourhood: '',
        address: '',
        raiting: '',
        image: '',
        price: '',
        roomTypeNames: '',
        welcomeText: '',
        badge: '',
        trustYouReviews: '',
        images: [],
        reviews: [],
        rooms: [],
        amenities: [],
        overview: [],
    };
    if(typeof data.data.body.pdpHeader.hotelId != 'undefined'){
        hotelInfo.id = data.data.body.pdpHeader.hotelId;
    }
    if(typeof data.data.body.propertyDescription.name != 'undefined'){
        hotelInfo.title = data.data.body.propertyDescription.name;
    }
    if(typeof data.neighborhood.neighborhoodName != 'undefined'){
        hotelInfo.neighbourhood = data.neighborhood.neighborhoodName;
    }else if(typeof data.data.body.propertyDescription.address.cityName != 'undefined'){
        hotelInfo.neighbourhood = data.data.body.propertyDescription.address.cityName;
    }
    if(typeof data.data.body.propertyDescription.address != 'undefined'){
        hotelInfo.address = `${data.data.body.propertyDescription.address.fullAddress}`;
    }
    if(typeof data.data.body.propertyDescription.starRatingTitle != 'undefined'){
        hotelInfo.raiting = data.data.body.propertyDescription.starRatingTitle;
    }
    if(typeof data.images.hotelImages[0].baseUrl != 'undefined'){
        hotelInfo.image = data.images.hotelImages[0].baseUrl.replace('{size}', 'z');
    }
    if(typeof data.data.body.propertyDescription.featuredPrice.currentPrice.formatted != 'undefined'){
        hotelInfo.price = `${data.data.body.propertyDescription.featuredPrice.currentPrice.formatted} - ${data.data.body.propertyDescription.featuredPrice.priceInfo} - ${data.data.body.propertyDescription.featuredPrice.totalPricePerStay}`;
    }
    if(typeof data.data.body.propertyDescription.mapWidget.staticMapUrl != 'undefined'){
        hotelInfo.mapWidget = `${data.data.body.propertyDescription.mapWidget.staticMapUrl}`;
    }
    if(typeof data.data.body.propertyDescription.roomTypeNames != 'undefined'){
        hotelInfo.roomTypeNames = data.data.body.propertyDescription.roomTypeNames.filter(function(item){
            return item ? true : false;
        }).join(', ');
    }
    if(typeof data.data.body.hotelWelcomeRewards.info != 'undefined'){
        hotelInfo.welcomeText = data.data.body.hotelWelcomeRewards.info;
    }
    if(typeof data.data.body.hotelBadge != 'undefined'){
        hotelInfo.badge = data.data.body.hotelBadge.label;
    }
    if(typeof data.data.body.guestReviews.trustYouReviews != 'undefined'){
        hotelInfo.trustYouReviews = data.data.body.guestReviews.trustYouReviews
            .map(({categoryName, percentage, text}) => {
                return {
                    categoryName: categoryName,
                    percentage: percentage,
                    text: text,
                }
            });
    }
    if(typeof data.reviews.guestReviewGroups.guestReviews != 'undefined' && data.reviews.guestReviewGroups.guestReviews.length && typeof data.reviews.guestReviewGroups.guestReviews[0].reviews != 'undefined'){
        hotelInfo.reviews = data.reviews.guestReviewGroups.guestReviews[0].reviews;
    }
    if(typeof data.data.body.roomsAndRates.rooms != 'undefined'){
        hotelInfo.rooms = data.data.body.roomsAndRates.rooms;
    }
    if(typeof data.images.hotelImages != 'undefined'){
        hotelInfo.images = data.images.hotelImages;
        if(hotelInfo.images.length){
            hotelInfo.images = hotelInfo.images.map(({baseUrl, sizes}) => {
                return {
                    url: baseUrl.replace('{size}', 'z'),
                    baseUrl: baseUrl,
                    sizes: sizes,
                }
            });

        }
    }
    if(typeof data.data.body.amenities != 'undefined'){
        hotelInfo.amenities = data.data.body.amenities;
    }
    if(typeof data.data.body.atAGlance != 'undefined'){
        hotelInfo.atAGlance = data.data.body.atAGlance;
    }
    if(typeof data.data.body.overview.overviewSections != 'undefined'){
        hotelInfo.overview = data.data.body.overview.overviewSections.filter(function(item){
            return item.type == 'HOTEL_FEATURE' || item.type == 'LOCATION_SECTION' ? true : false;
        });
    }
    console.log('hotelInfo', hotelInfo);
    return hotelInfo;
}
const clearHotelCard = () => {
    const element = document.querySelector('#cardHotel');
    element.innerHTML = "";
}
const buildPagination = (data = {}) => {
    if(data.currentPage > 0) data.currentPage--;
    const paginationElement = document.querySelector('.uk-pagination');
    const pagination = UIkit.pagination(paginationElement, data);
    $('.uk-pagination').on('select.uk.pagination', async function(e, pageIndex){
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
const paginate = async(params = {}) => {
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
    let element = document.querySelector(".form-wrapper");
    element.className = "form-wrapper ";
    element.classList.add(`bg${rand}`);
}
const updateBg = () => {
    setRandBg();
    const playlistEditing = setInterval(function(){
        setRandBg();
    }, 5 * 1000 * 60);
}

document.addEventListener("DOMContentLoaded", async() => {
    updateBg();
    const form = document.getElementById("form");
    if(form && form.length){
        if(document.querySelector("[name='check_in']")){
            document.querySelector("[name='check_in']").value = moment().add(10, 'days').format("YYYY-MM-DD");
        }
        if(document.querySelector("[name='check_out']")){
            document.querySelector("[name='check_out']").value = moment().add(12, 'days').format("YYYY-MM-DD");
        }
        form.addEventListener("submit", async(e) => {
            e.preventDefault();
            try{
                let queryText = document.querySelector("[name='title']").value;
                let queryCheckIn = document.querySelector("[name='check_in']").value;
                let queryCheckOut = document.querySelector("[name='check_out']").value;
                let queryRooms = document.querySelector("[name='rooms']").value;
                if(!queryText){
                    return;
                }
                let dataAddressInfo = await getPlaceInfo(queryText);
                if(!dataAddressInfo){
                    return;
                }
                loadingStart();
                clearPagination();
                clearHotelCard();
                let params = {
                    lat: dataAddressInfo.lat,
                    lon: dataAddressInfo.lon,
                    checkIn: moment(queryCheckIn).format("YYYY-MM-DD"),
                    checkOut: moment(queryCheckOut).format("YYYY-MM-DD"),
                    rooms: queryRooms || 1,
                    pageNumber: 1,
                };
                const data = await getSearchNearby(params);
                renderCards(data);
                loadingEnd();
                return;
            }catch(error){
                console.log(error);
                UIkit.notify({message: "Error", status: "danger"});
            }
        });
    }
});
