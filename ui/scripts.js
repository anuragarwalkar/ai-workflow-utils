document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const promptParam = urlParams.get('prompt');

    if (promptParam) {
        document.getElementById('prompt').value = decodeURIComponent(promptParam);
    }
});

let previewData = null;

document.getElementById('generateForm').addEventListener('submit', async (event) => {
    event.preventDefault();

    const previewButton = event.target.querySelector('button[type="submit"]');
    previewButton.disabled = true;

    const prompt = document.getElementById('prompt').value;
    const imageFile = document.getElementById('image').files[0];

    if (!imageFile) {
        alert('Please upload an image.');
        previewButton.disabled = false;
        return;
    }

    document.getElementById('loader').style.display = 'block';

    const reader = new FileReader();
    reader.onload = async () => {
        const base64Image = reader.result.split(',')[1];

        const url = new URL(window.location.href);
        url.searchParams.set('prompt', encodeURIComponent(prompt));
        window.history.replaceState({}, '', url);

        const response = await fetch('/api/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt,
                images: [base64Image]
            })
        });

        document.getElementById('loader').style.display = 'none';
        previewButton.disabled = false;

        if (response.ok) {
            const result = await response.json();
            previewData = result;
            document.getElementById('summary').value = result.summary;
            document.getElementById('description').value = result.description;
            document.getElementById('previewSection').style.display = 'block';
        } else {
            alert('Error: ' + (await response.text()));
        }
    };

    reader.readAsDataURL(imageFile);
});

document.getElementById('createJiraButton').addEventListener('click', async () => {
    if (!previewData) {
        alert('No preview data available.');
        return;
    }

    const createJiraButton = document.getElementById('createJiraButton');
    createJiraButton.disabled = true;

    const summary = document.getElementById('summary').value;
    const description = document.getElementById('description').value;
    const imageFile = document.getElementById('image').files[0];

    document.getElementById('loaderCreateJira').style.display = 'block';

    try {
        const generateResponse = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                summary,
                description
            })
        });

        if (!generateResponse.ok) {
            alert('Error creating Jira issue: ' + (await generateResponse.text()));
            return;
        }

        const generateResult = await generateResponse.json();
        const issueKey = generateResult.jiraIssue.key;

        const formData = new FormData();
        formData.append('file', imageFile);
        formData.append('issueKey', issueKey);

        const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.ok) {
            alert('Error uploading image: ' + (await uploadResponse.text()));
            return;
        }

        const uploadResult = await uploadResponse.json();
        alert('Success: ' + uploadResult.message);
    } catch (error) {
        alert('An error occurred: ' + error.message);
    } finally {
        document.getElementById('loaderCreateJira').style.display = 'none';
        createJiraButton.disabled = false;
    }
});
