import Search from "./modules/search";
import Chat from "./modules/chat";

if (document.querySelector("#chat-wrapper")) {
    new Chat();
};

if (document.querySelector(".header-search-icon")) { // kui kasutaja pole sisse logitud, ära üldse paku talle search võimalust
    new Search();
};
