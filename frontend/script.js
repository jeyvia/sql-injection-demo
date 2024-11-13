// Store parsed data at a higher scope
let parsedExperienceData = [];
let parsedEducationData = [];

function parseSections(text) {
    const lines = text.trim().split('\n');
    const firstName = lines[0].trim().slice(4);
    const lastName = lines[2].trim()
    const phoneNumber = text.match(/PHONE:\s*\n(.*)/);
    const email = text.match(/EMAIL:\s*\n(.*)/);
    const educationSection = text.match(/EDUCATION([\s\S]*?)EXPERIENCE/);
    const experienceSection = text.match(/EXPERIENCE([\s\S]*?)CERTIFICATIONS/);

    return {
        firstName: firstName,
        lastName: lastName,
        number: phoneNumber ? phoneNumber[1].trim() : null,
        email: email ? email[1].trim() : null,
        education: educationSection ? educationSection[1].trim() : null,
        experience: experienceSection ? experienceSection[1].trim() : null,
    };
}

function parseEducation(text) {
    const lines = text.split('\n').filter(line => line.trim() !== "");
    const educationObject = [];
    for (let i = 0; i < lines.length; i += 3) {
        const education = {
            school: lines[i],
            degree: lines[i + 1],
            period: lines[i + 2]
        };
        educationObject.push(education);
    }
    return educationObject;
}

function parseExperience(text) {
    const lines = text.split('\n').filter(line => line.trim() !== "");
    const experienceObject = [];
    for (let i = 0; i < lines.length;) {
        let j = i + 4;
        let descriptionString = lines[i + 3];
        let count = 1
        while (count < 4 && j < lines.length) {
            if (lines[j].includes("-")) {
                count++;
            }
            descriptionString += lines[j];
            if (lines[j].includes(".")) {
                if (count == 3) {
                    j++;
                    break;
                }
                else {
                    descriptionString += '\n';
                }
            }
            j++
        }
        const experience = {
            organisation: lines[i],
            position: lines[i + 1],
            period: lines[i + 2],
            description: descriptionString
        }
        experienceObject.push(experience);
        i = j;
    }
    return experienceObject;
}

// Form submission handler
document.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);
    
    // Get the gender value from the select dropdown
    const genderSelect = document.getElementById('occupation');
    if (genderSelect) {
        formData.set('gender', genderSelect.value);  // Use set instead of append in case it's already in formData
    }

    // Add the parsed experience and education data
    formData.append('experiences', JSON.stringify(parsedExperienceData));
    formData.append('education', JSON.stringify(parsedEducationData));

    // Log the form data to verify what's being sent
    for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
    }

    try {
        const response = await fetch('http://localhost:3000/api/submit-application', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('Application submitted successfully!');
            event.target.reset();
            // Reset the parsed data
            parsedExperienceData = [];
            parsedEducationData = [];
        } else {
            alert('Error submitting application: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error submitting application');
    }

    //insert data from search endpoint here
    document.getElementById('submission-name').textContent = "data";

    document.getElementById('success-message').style.display = 'block';
});

// PDF upload handler
document.getElementById('resumeUpload').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return alert('Please upload a PDF file');

    try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.mjs';
        const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
        let textContent = '';

        const page = await pdf.getPage(1);
        const text = await page.getTextContent();
        textContent += text.items.map(item => item.str).join('\n');

        const parsedContent = parseSections(textContent);
        parsedEducationData = parseEducation(parsedContent.education);
        parsedExperienceData = parseExperience(parsedContent.experience);

        // Populate form fields
        if (parsedContent.firstName) {
            document.getElementById('firstname').value = parsedContent.firstName;
        }

        if (parsedContent.lastName) {
            document.getElementById('lastname').value = parsedContent.lastName;
        }

        if (parsedContent.number) {
            document.getElementById('areacode').value = parsedContent.number.slice(1, 4);
            document.getElementById('phone').value = parsedContent.number.slice(6);
        }

        if (parsedContent.email) {
            document.getElementById('email').value = parsedContent.email;
        }

        if (parsedEducationData.length > 0) {
            const latestEdu = parsedEducationData[0];
            document.getElementById('school-1').value = latestEdu.school;
            document.getElementById('period-1').value = latestEdu.period;
            document.getElementById('degree-1').value = latestEdu.degree;
        }

        if (parsedExperienceData.length > 0) {
            const latestExp = parsedExperienceData[0];
            document.getElementById('company').value = latestExp.organisation;
            document.getElementById('position').value = latestExp.position;
            document.getElementById('description').value = latestExp.description;
        }
    } catch (error) {
        console.error('Error processing PDF:', error);
        alert('Error processing PDF file');
    }
});