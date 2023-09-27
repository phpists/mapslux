const API_KEY = "AIzaSyAygbD67n00EoRcHC5ca-sPqsSbBaEdvrg";
let delivery_type = "Почта россии";
let map;

const handleToggleLoading = (type = true) => {
  const loader = document.querySelector(".overlay-loading");
  loader.classList.toggle("active", type);
};

const handleRenderOrderModal = (title, address) => {
  const modal = document.querySelector(".overlay-order");
  const content = `
    <div class="modal">
        <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            class="closeBtn"
        >
            <path d="M2 2L18 18" fill="none" stroke-width="1.5"></path>
            <path d="M2 18L18 2" fill="none" stroke-width="1.5"></path>
        </svg>
        <div class="pickup-item__title">${title ?? ""}</div>
        <div class="pickup-item__address">
            <div class="pickup-item__text"> ${address ?? ""}</div>
        </div>
        <button class="submit">Привезти сюда</button>
    </div>
  `;

  modal.innerHTML = "";
  modal.innerHTML = content;
  const closeBtn = document.querySelector(".overlay-order .closeBtn");
  modal.classList.add("active");

  closeBtn.addEventListener("click", () => modal.classList.remove("active"));
};

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

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 55.751244, lng: 37.618423 },
    zoom: 9,
  });
  setMarkers(map);
}

var markersArray = [];

function clearOverlays() {
  for (var i = 0; i < markersArray.length; i++) {
    markersArray[i].setMap(null);
  }
  markersArray.length = 0;
}

function setMarkers(map, points = []) {
  var infowindow = new google.maps.InfoWindow();
  clearOverlays();

  if (markersArray.length === 0) {
    for (var i = 0; i < points.length; i++) {
      var point = points[i];
      var marker = new google.maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map: map,
        title: point.name,
      });
      markersArray.push(marker);
      google.maps.event.addListener(
        marker,
        "click",
        (function (marker, i) {
          return function () {
            handleSelectPost(points[i].place_id);
          };
        })(marker, i)
      );
    }
  }
}

const handleRenderMarkers = (map, places) => {
  const points = places.map((p) => ({
    name: p.name,
    formatted_address: p.formatted_address,
    place_id: p.place_id,
    lat: p.geometry.location.lat(),
    lng: p.geometry.location.lng(),
  }));
  let filteredPoints = [];

  points.forEach((place) => {
    if (!filteredPoints.find((p) => p.place_id === place.place_id)) {
      filteredPoints.push(place);
    }
  });

  setMarkers(map, filteredPoints);
};

const handleOrder = () => {
  const buttons = document.querySelectorAll(".pickup-item__button");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const title = btn.getAttribute("data-title");
      const address = btn.getAttribute("data-address");

      handleRenderOrderModal(title, address);
    });
  });
};

const handleFormatPickupCard = (place) =>
  `
    <div class="pickup-item" data-id="${place.place_id}">
        <div class="pickup-item__title">${place?.name ?? ""}</div>
        <div class="pickup-item__address">
            <div class="pickup-item__text">${
              place?.formatted_address ?? ""
            }</div>
        </div>
        <div class="more-content">
        <div class="pickup-item__section">
            <div class="pickup-item__section-title">режим работы </div>
            <b class="pickup-item__text">${
              place.isOpen ? "Открыт" : "Закрыт"
            }</b>
        </div>
        <button 
            class="pickup-item__button" 
            data-id="${place.place_id}" 
            data-title="${place?.name ?? ""}"
            data-address="${place?.formatted_address ?? ""}" 
        >Привезти сюда</button>
        </div>
    </div>
    `;

const handleFormatPlaces = (places) => {
  const formatedPlaces = places.map((p) => ({
    name: delivery_type,
    formatted_address: p.formatted_address,
    place_id: p.place_id,
    isOpen: p?.opening_hours?.isOpen() ?? false,
  }));

  const listWrapper = document.querySelector(".list-wrapper");
  const cards = formatedPlaces.map((p) => handleFormatPickupCard(p)).join(" ");

  listWrapper.innerHTML = cards;
  handleClickOnPickItem();
  handleToggleLoading(false);
  handleOrder();
};

const handleGetPlacePlaces = async (query, map, clear) => {
  handleToggleLoading(true);
  let places = [];
  const request = {
    query: `${query} ${delivery_type}`,
    fields: ["name", "geometry"],
  };
  let service = new google.maps.places.PlacesService(map);
  service.textSearch(request, (results, status, pagination) => {
    places = [...places, ...results];

    if (
      status == google.maps.places.PlacesServiceStatus.OK &&
      !pagination.hasNextPage
    ) {
      handleRenderMarkers(map, places, clear);
      handleFormatPlaces(places);
    }

    if (pagination.hasNextPage) {
      sleep: 2;
      pagination.nextPage();
    }
  });
};

const handleSearchAddress = async () => {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: 55.751244, lng: 37.618423 },
    zoom: 5,
    mapTypeControl: false,
  });
  const card = document.getElementById("pac-card");
  const input = document.querySelector(".find-address-input");
  const options = {
    fields: ["formatted_address", "geometry", "name"],
    componentRestrictions: { country: "ru" },
  };

  map.controls[google.maps.ControlPosition.TOP_LEFT].push(card);

  const autocomplete = new google.maps.places.Autocomplete(input, options);

  autocomplete.bindTo("bounds", map);

  const infowindow = new google.maps.InfoWindow();
  const infowindowContent = document.getElementById("infowindow-content");

  infowindow.setContent(infowindowContent);

  autocomplete.addListener("place_changed", () => {
    infowindow.close();
    const place = autocomplete.getPlace();
    handleGetPlacePlaces(input.value, map);
    // reinitialize with new input value

    if (!place.geometry || !place.geometry.location) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      window.alert("No details available for input: '" + place.name + "'");
      return;
    }

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) {
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(17);
    }
  });
};

const handleChangeType = () => {
  const select = document.querySelector(".select-delivery-type");
  const selectValue = document.querySelector(".select-delivery-type-value");
  const options = document.querySelectorAll(".select-delivery-type-opt");
  const input = document.querySelector(".find-address-input");

  options.forEach((opt) => {
    opt.addEventListener("click", () => {
      const value = opt.getAttribute("data-type");
      delivery_type = value;
      selectValue.innerText = value;
      select.blur();
      handleGetPlacePlaces(input.value, map);
    });
  });
};

document.addEventListener("DOMContentLoaded", () => {
  handleSearchAddress();
  handleChangeType();
});
