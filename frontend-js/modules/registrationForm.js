import axios from "axios";

export default class RegistrationForm {

    constructor() {
        this._csrf = document.querySelector("[name='_csrf']").value; // storing csrf value
        this.form = document.querySelector("#registration-form");
        this.allFields = document.querySelectorAll("#registration-form .form-control"); // tagastab mitmetest elementidest koosneva array
        this.insertValidationElements();
        this.username = document.querySelector("#username-register");
        this.username.previousValue = "";
        this.email = document.querySelector("#email-register");
        this.email.previousValue = "";
        this.password = document.querySelector("#password-register");
        this.password.previousValue = "";
        this.username.isUnique = false;
        this.email.isUnique = false;
        this.events();
    };

    // EVENTS
    events() {
        this.form.addEventListener("submit", e => {
            e.preventDefault();
            this.formSubmitHandler();
        });
        this.username.addEventListener("keyup", () => { // check for username
            this.isDifferent(this.username, this.usernameHandler);
        });
        this.email.addEventListener("keyup", () => { // check for email
            this.isDifferent(this.email, this.emailHandler);
        });
        this.password.addEventListener("keyup", () => { // check for password
            this.isDifferent(this.password, this.passwordHandler);
        });
        this.username.addEventListener("blur", () => { // blur -> when you exit the field (kuula evente ka siis, kui kasutaja väljalt eemaldub ennem, kui keyup event listener jõuab tegutsema hakata)
            this.isDifferent(this.username, this.usernameHandler);
        });
        this.email.addEventListener("blur", () => {
            this.isDifferent(this.email, this.emailHandler);
        });
        this.password.addEventListener("blur", () => {
            this.isDifferent(this.password, this.passwordHandler);
        });
    };

    // METHODS
    formSubmitHandler() { // luba registration form saata vaid siis, kui ühtegi järgnevat errorit ei ole
        this.usernameImmediately();
        this.usernameAfterDelay();
        this.emailAfterDelay();
        this.passwordImmediately();
        this.passwordAfterDelay();
        if (
            this.username.isUnique &&
            !this.username.errors &&
            this.email.isUnique &&
            !this.email.errors &&
            !this.password.errors
            ) {
            this.form.submit();
        };
    };

    isDifferent(el, handler) {
        if (el.previousValue != el.value) {
            handler.call(this);
        }
        el.previousValue = el.value;
    };

    usernameHandler() {
        this.username.errors = false; // alustab validation check-i uuesti iga kord kui kasutaja klaviatuurile vajutab
        this.usernameImmediately();
        clearTimeout(this.username.timer);
        this.username.timer = setTimeout(() => this.usernameAfterDelay(), 800);
    };

    passwordHandler() {
        this.password.errors = false;
        this.passwordImmediately();
        clearTimeout(this.password.timer);
        this.password.timer = setTimeout(() => this.passwordAfterDelay(), 800);
    };

    passwordImmediately() {
        if (this.password.value.length > 50) {
            this.showValidationError(this.password, "Password cannot exceed 50 characters");
        };
        if(!this.password.errors) {
            this.hideValidationError(this.password);
        };
    };

    passwordAfterDelay() {
        if (this.password.value.length < 12) {
            this.showValidationError(this.password, "Password must be at least 12 characters");
        }
    };

    emailHandler() {
        this.email.errors = false;
        clearTimeout(this.email.timer);
        this.email.timer = setTimeout(() => this.emailAfterDelay(), 800);
    };

    emailAfterDelay() {
        if (!/^\S+@\S+$/.test(this.email.value)) { // kontrolli, et emaili sisendiks oleks sõne@sõne
            this.showValidationError(this.email, "You must provide a valid email address.");
        };
        if (!this.email.errors) {
            axios.post("/doesEmailExist", {_csrf: this._csrf, email: this.email.value}).then((response) => { // kontrolli, kas email on juba kasutusel
                if (response.data) {
                    this.email.isUnique = false;
                    this.showValidationError(this.email, "That email is already being used");
                } else {
                    this.email.isUnique = true;
                    this.hideValidationError(this.email);
                }
            }).catch(() => {

            });
        }
    };

    usernameImmediately() {
        if (this.username.value != "" && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) { // kontrolli, et kasutaja sisend koosneks vaid lubatud tähemärkidest
            this.showValidationError(this.username, "Username can only contain letters and numbers.");
        };
        if (this.username.value.length > 30) { // kontrolli kasutajanime pikkust
            this.showValidationError(this.username, "Username cannot exceed 30 characters.")
        };
        if (!this.username.errors) { // kui erroreid pole, peida errori väli
            this.hideValidationError(this.username);
        };
    };

    hideValidationError(el) {
        el.nextElementSibling.classList.remove("liveValidateMessage--visible");
    };

    showValidationError(el, message) {
        el.nextElementSibling.innerHTML = message;
        el.nextElementSibling.classList.add("liveValidateMessage--visible");
        el.errors = true;
    };

    usernameAfterDelay() {
        if (this.username.value.length < 3) { // kontrolli, et kasutajanimi oleks pikem kui 3 tähemärki
            this.showValidationError(this.username, "Username must be at least 3 characters.");
        };
        if (!this.username.errors) {
            axios.post("/doesUsernameExist", {_csrf: this._csrf, username: this.username.value}).then((response) => { // kontrolli, kas kasutajanimi on juba võetud
                if (response.data) {
                    this.showValidationError(this.username, "That username is already taken.");
                    this.username.isUnique = false;
                } else {
                    this.username.isUnique = true;
                }
            }).catch(() => {

            });
        };
    };

    insertValidationElements() {
        this.allFields.forEach(function(el) { // el-> element
            el.insertAdjacentHTML("afterend", "<div class='alert alert-danger small liveValidateMessage'></div>");
        });
    };
};