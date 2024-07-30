(function() {
    // Get all data in form and return object
    function getFormData(form) {
        const elements = form.elements;
        let honeypot;
  
        const fields = Object.keys(elements).filter(k => {
            if (elements[k].name === "honeypot") {
                honeypot = elements[k].value;
                return false;
            }
            return true;
        }).map(k => {
            if (elements[k].name !== undefined) {
                return elements[k].name;
            } else if (elements[k].length > 0) {
                return elements[k].item(0).name;
            }
        }).filter((item, pos, self) => self.indexOf(item) === pos && item);
  
        const formData = {};
        fields.forEach(name => {
            const element = elements[name];
            formData[name] = element.length ? 
                Array.from(element).filter(item => item.checked || item.selected).map(item => item.value).join(', ') :
                element.value;
        });
  
        // Add form-specific values into the data
        formData.formDataNameOrder = JSON.stringify(fields);
        formData.formGoogleSheetName = form.dataset.sheet || "Attendance"; // Default sheet name
        formData.formGoogleSendEmail = form.dataset.email || ""; // No email by default
  
        return { data: formData, honeypot };
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
                    if (formElements) {
                        formElements.style.display = "none"; // Hide form
                    }
                    const thankYouMessage = form.querySelector(".thankyou_message");
                    if (thankYouMessage) {
                        thankYouMessage.style.display = "block";
                    }
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
        // Bind to the submit event of our form
        document.querySelectorAll("form.gform").forEach(form => 
            form.addEventListener("submit", handleFormSubmit, false)
        );
    }
    document.addEventListener("DOMContentLoaded", loaded, false);
  
    function toggleButtons(form, state) {
        form.querySelectorAll("button").forEach(button => button.disabled = state);
    }
  
    function disableAllButtons(form) {
        toggleButtons(form, true);
    }
  
    function enableAllButtons(form) {
        toggleButtons(form, false);
    }
  })();
  