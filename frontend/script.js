document.getElementById('resumeUpload').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return alert('Please upload a PDF file');

    try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.mjs';
        const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
        let textContent = '';

        const page = await pdf.getPage(1);
        const text = await page.getTextContent();
        textContent += text.items.map(item => item.str).join(' ');

        console.log(text);
    } catch (error) {
        console.error('Error processing PDF:', error);
    }
});