(function() {
    // get all data in form and return object
    function getFormData(form) {
        var elements = form.elements;
        var honeypot;

        var fields = Object.keys(elements).filter(function(k) {
            if (elements[k].name === "honeypot") {
                honeypot = elements[k].value;
                return false;
            }
            return true;
        }).map(function(k) {
            if (elements[k].name !== undefined) {
                return elements[k].name;
            // special case for Edge's html collection
            } else if (elements[k].length > 0) {
                return elements[k].item(0).name;
            }
        }).filter(function(item, pos, self) {
            return self.indexOf(item) == pos && item;
        });

        var formData = {};
        fields.forEach(function(name) {
            var element = elements[name];

            // singular form elements just have one value
            formData[name] = element.value;

            // when our element has multiple items, get their values
            if (element.length) {
                var data = [];
                for (var i = 0; i < element.length; i++) {
                    var item = element.item(i);
                    if (item.checked || item.selected) {
                        data.push(item.value);
                    }
                }
                formData[name] = data.join(', ');
            }
        });

        // add form-specific values into the data
        formData.formDataNameOrder = JSON.stringify(fields);
        formData.formGoogleSheetName = form.dataset.sheet || "Attendance"; // default sheet name
        formData.formGoogleSendEmail = form.dataset.email || ""; // no email by default

        return { data: formData, honeypot: honeypot };
    }

    function handleFormSubmit(event) {
        event.preventDefault(); // Prevent default form submission
        const form = event.target;
        const formData = getFormData(form);
        const data = formData.data;

        // If a honeypot field is filled, assume it was done by a spam bot.
        if (formData.honeypot) {
            return false;
        }

        // Check if any required input fields are empty
        if (!data.empCode || !data.empName || !data.siteID || !data.workOrderNo || !data.indatetime || !data.outdatetime || !data.incurrentLatitude || !data.outcurrentLatitude || !data.incurrentLongitude || !data.outcurrentLongitude) {
            alert("Please scan all necessary QR codes before submitting.");
            return false;
        }

        disableAllButtons(form);

        // Alert before submitting the form
        alert("Your attendance has been submitted!");

        const url = form.action;
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    form.reset();
                    const formElements = form.querySelector(".form-elements");
                    if (formElements && formElements.parentNode) {
                        try {
                            formElements.parentNode.removeChild(formElements); // Safely remove form elements
                        } catch (error) {
                            console.error("Error removing form elements:", error);
                        }
                    }
                    const thankYouMessage = form.querySelector(".thankyou_message");
                    if (thankYouMessage) {
                        thankYouMessage.style.display = "block";
                    }
                } else {
                    console.error("Form submission error:", xhr.status, xhr.statusText);
                }
                enableAllButtons(form); // Enable buttons after submission
            }
        };

        // URL encode form data for sending as POST data
        const encoded = Object.keys(data).map(k => 
            `${encodeURIComponent(k)}=${encodeURIComponent(data[k])}`
        ).join('&');
        xhr.send(encoded);
    }

    function loaded() {
        // bind to the submit event of our form
        var forms = document.querySelectorAll("form.gform");
        for (var i = 0; i < forms.length; i++) {
            forms[i].addEventListener("submit", handleFormSubmit, false);
        }
    }
    document.addEventListener("DOMContentLoaded", loaded, false);

    function disableAllButtons(form) {
        var buttons = form.querySelectorAll("button");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].disabled = true;
        }
    }

    function enableAllButtons(form) {
        var buttons = form.querySelectorAll("button");
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].disabled = false;
        }
    }
})();
