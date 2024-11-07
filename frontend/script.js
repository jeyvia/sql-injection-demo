function parseSections(text) {
    const educationSection = text.match(/EDUCATION([\s\S]*?)EXPERIENCE/);
    const experienceSection = text.match(/EXPERIENCE([\s\S]*?)CERTIFICATIONS/);

    return {
        education: educationSection ? educationSection[1].trim() : null,
        experience: experienceSection ? experienceSection[1].trim() : null,
    };
}

function parseEducation(text) {
    const lines = text.split('\n').filter(line => line.trim() !== "");
    console.log(lines);
    const educationObject = [];
    for (let i = 0; i < lines.length; i += 3) {
        const education = {
            school: lines[i],
            degree: lines[i+1],
            period: lines[i+2]
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
            position: lines[i+1],
            period: lines[i+2],
            description: descriptionString
        }
        experienceObject.push(experience);
        i = j;
    }
    return experienceObject;
}

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
        const experienceObject = parseExperience(parsedContent.experience);
        console.log(educationObject);
        console.log(experienceObject)
    } catch (error) {
        console.error('Error processing PDF:', error);
    }
});