const SUGGEST_API_KEY = '05c41b12-223c-47e0-a0df-9403b108f3cd';
const SEARCH_API_KEY = 'd46bfdd1-d9ca-4f94-959e-5c09d2a427e1';
var myMap;
function initYandex(){
    // Creating the map.
    myMap = new ymaps.Map("map", {
        // The map center coordinates.
        // Default order: «latitude, longitude».
        // To not manually determine the map center coordinates,
        // use the Coordinate detection tool.
        center: [55.76, 37.64],
        // Zoom level. Acceptable values:
        // from 0 (the entire world) to 19.
        zoom: 7
    });
}

ymaps.ready(initYandex);

const handleSelectPost = (id) => {
    const pickupCards = document.querySelectorAll(".pickup-item");
    const listWrapper = document.querySelector(".list-wrapper");

    pickupCards.forEach((card) => {
        const cardId = card.getAttribute("data-id");
        card.classList.toggle("active", cardId === id);
        if (cardId === id) {
            listWrapper.scroll({
                top: card?.offsetTop - 200,
                behavior: "smooth",
            });
        }
    });
};

const handleClickOnPickItem = () => {
    const pickupCards = document.querySelectorAll(".pickup-item");

    pickupCards.forEach((card) => {
        const cardId = card.getAttribute("data-id");
        card.addEventListener("click", () => handleSelectPost(cardId));
    });
};

function searchInit() {
    const input = document.querySelector(".find-address-input");
    input.addEventListener('input', handleSearch);
}

const handleFormatPickupCard = (place) =>
    `
    <div class="pickup-item" data-id="${place?.id}">
        <div class="pickup-item__title">${place?.name ?? ""}</div>
        <div class="pickup-item__address">
            <div class="pickup-item__text">${
        place?.address ?? ""
    }</div>
        </div>
        <div class="more-content">
        <div class="pickup-item__section">
            <div class="pickup-item__section-title">режим работы </div>
            <b class="pickup-item__text">${
        place?.isOpen ? "Открыт" : "Закрыт"
    }</b>
        </div>
        <button class="pickup-item__button">Привезти сюда</button>
        </div>
    </div>
`;

function setMarker(post_office){
    console.log(post_office)
    post_office_coordinates = post_office.geometry.coordinates;
    let myGeoObject = new ymaps.Placemark(
        [post_office_coordinates[1], post_office_coordinates[0]],
        {balloonContent: `<h2>${post_office.properties.CompanyMetaData.name}</h2><p>${post_office.properties.CompanyMetaData.Hours?.text}</p>`},
        { preset: 'islands#icon', iconColor:'#0095b6' }
    );
    myMap.geoObjects.add(myGeoObject);
}

async function findPlaces(boundaries) {
    let post_office = document.querySelector('.select-delivery-type-opt.active');
    axios.get('https://search-maps.yandex.ru/v1/', {
        params: {
            apikey: SEARCH_API_KEY,
            text: post_office.dataset.type,
            type: 'biz',
            lang: 'ru_RU',
            bbox: boundaries,
            rspn: 1,
            results: 50
        }
    }).then((res) => {
        myMap.geoObjects.removeAll();
        let cards = res.data.features.map((el) => {
            setMarker(el);
            return handleFormatPickupCard(el.properties.CompanyMetaData);
        })
        const listWrapper = document.querySelector(".list-wrapper");
        listWrapper.innerHTML = cards.join('');
        handleClickOnPickItem();
    })
}

const loadDeliveryPlaces = async () => {
    let location_name = document.querySelector('.find-address-input').value;
    if (location_name === '' || location_name ==null) {
        return;
    }
    console.log(location_name)
    let location = ymaps.geocode(location_name, {
        kind: 'locality',
        results: 10
    });
    location.then((res) => {
        let boundaries = res.geoObjects.get(0).properties.get('boundedBy');
        console.log(boundaries)
        let center = res.geoObjects.get(0).geometry.getCoordinates();
        myMap.setCenter(center, 10, {
            duration: 500
        });
        const border = (boundaries[0][1] + ',' + boundaries[0][0])
            + '~'
            + (boundaries[1][1] + ',' + boundaries[1][0])
        findPlaces(border);
    });
};

function locationItemInit(el) {
    el.addEventListener('click', async () => {
        document.querySelector('.find-address-input').value = el.dataset.value;
        let prompt = document.getElementById('suggest_location');
        prompt.innerHTML = "";
        await loadDeliveryPlaces();
    })
}

async function handleSearch(ev) {
    let search = ev.currentTarget.value;
    axios.get('https://suggest-maps.yandex.ru/v1/suggest', {
        params: {
            apikey: SUGGEST_API_KEY,
            types: 'locality',
            text: search
        }
    }).then(function (res) {
        let prompt = document.getElementById('suggest_location');
        prompt.innerHTML = "";
        res.data.results.forEach((el) => {
            let elData = document.createElement('div');
            elData.innerText = el.title.text;
            elData.classList.add('location_item');
            elData.dataset.value = elData.innerText;
            prompt.appendChild(elData);
            locationItemInit(elData);
        });
        prompt.classList.add('active')
    })
}


searchInit()
document.querySelectorAll('.select-delivery-type-opt').forEach((el) => {
    let delivery_value = document.querySelector('.select-delivery-type-value');
    el.addEventListener('click', async () => {
        document.querySelector('.select-delivery-type-opt.active').classList.toggle('active');
        el.classList.toggle('active');
        delivery_value.innerText = el.dataset.type;
        await loadDeliveryPlaces();
    });
})