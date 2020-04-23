import Search from "./modules/search";

if (document.querySelector(".header-search-icon")) { // pmts kui kasutaja pole sisse logitud, ära üldse paku talle search võimalust
    new Search();
};
