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

document.querySelector('form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    // Add the parsed experience data
    formData.append('experiences', JSON.stringify(parsedExperienceData));

    try {
        const response = await fetch('http://localhost:3000/api/submit-application', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('Application submitted successfully!');
            event.target.reset();
        } else {
            alert('Error submitting application: ' + result.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error submitting application');
    }
});

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
        const educationObject = parseEducation(parsedContent.education);
        const parsedExperienceData = parseExperience(parsedContent.experience);
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

        if (educationObject.length > 0) {
            const latestEdu = educationObject[0];
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
    }
});
