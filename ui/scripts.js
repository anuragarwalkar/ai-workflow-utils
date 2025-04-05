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
        const base64Image = reader.result.split(',')[1]; // Ensure Base64 encoding is correct

        const url = new URL(window.location.href);
        url.searchParams.set('prompt', encodeURIComponent(prompt));
        window.history.replaceState({}, '', url);

        try {
            const response = await fetch('/api/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    images: [base64Image]
                })
            });

            if (response.ok) {
                const result = await response.json();
                previewData = result;
                document.getElementById('summary').value = result.summary;
                document.getElementById('description').value = result.description;
                document.getElementById('previewSection').style.display = 'block';
            } else {
                const errorText = await response.text();
                console.error('Preview error:', errorText); // Log detailed error for debugging
                alert('Error: ' + errorText);
            }
        } catch (error) {
            console.error('Preview request error:', error); // Log error for debugging
            alert('An error occurred: ' + error.message);
        } finally {
            document.getElementById('loader').style.display = 'none';
            previewButton.disabled = false;
        }
    };

    reader.onerror = () => {
        console.error('FileReader error:', reader.error); // Log FileReader errors
        alert('Failed to read the file. Please try again.');
        document.getElementById('loader').style.display = 'none';
        previewButton.disabled = false;
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

document.getElementById('createJiraButtonMain').addEventListener('click', () => {
    document.getElementById('homeButtons').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
});

document.getElementById('viewJiraButton').addEventListener('click', () => {
    document.getElementById('homeButtons').style.display = 'none';
    document.getElementById('viewJiraModal').style.display = 'block';
});

document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('viewJiraModal').style.display = 'none';
    document.getElementById('homeButtons').style.display = 'block';
    document.getElementById('jiraDetails').style.display = 'none';
    document.getElementById('jiraId').value = '';
});

document.getElementById('fetchJiraButton').addEventListener('click', async () => {
    const fetchJiraButton = document.getElementById('fetchJiraButton');
    const loaderFetchJira = document.getElementById('loaderFetchJira');
    const jiraDetails = document.getElementById('jiraDetails');

    // Show loader and disable button
    loaderFetchJira.style.display = 'block';
    fetchJiraButton.disabled = true;

    try {
        const jiraId = document.getElementById('jiraId').value;
        if (!jiraId) {
            alert('Please enter a Jira ID.');
            return;
        }

        const response = await fetch(`api/issue/${jiraId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch Jira issue.');
        }
        const { fields } = await response.json();
        document.getElementById('jiraSummary').textContent = fields.summary || 'No summary available';

        // Render description as formatted HTML
        const descriptionElement = document.getElementById('jiraDescription');
        descriptionElement.innerHTML = fields.description
            ? fields.description.replace(/\n/g, '<br>') // Replace newlines with <br> for proper formatting
            : 'No description available';

        jiraDetails.style.display = 'block';
    } catch (error) {
        alert('Error fetching Jira issue: ' + error.message);
    } finally {
        // Hide loader and enable button
        loaderFetchJira.style.display = 'none';
        fetchJiraButton.disabled = false;
    }
});

document.getElementById('attachmentFile').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const addAttachmentButton = document.getElementById('addAttachmentButton');
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');

    if (file) {
        fileName.textContent = file.name; // Display the correct file name
        filePreview.style.display = 'block';
        addAttachmentButton.disabled = false;
    } else {
        filePreview.style.display = 'none';
        addAttachmentButton.disabled = true;
    }
});

document.getElementById('addAttachmentButton').addEventListener('click', async () => {
    const fileInput = document.getElementById('attachmentFile');
    const file = fileInput.files[0];
    const jiraId = document.getElementById('jiraId').value;
    const loaderAddAttachment = document.getElementById('loaderAddAttachment'); // Ensure loader element is used

    if (!file || !jiraId) {
        alert('Please select a file and ensure a Jira ID is entered.');
        return;
    }

    const formData = new FormData();
    formData.append('file', file); // Ensure the file is appended with the key 'file'
    formData.append('issueKey', jiraId); // Ensure the issueKey is appended
    formData.append('fileName', file.name); // Include the original file name

    // Show loader and disable button
    loaderAddAttachment.style.display = 'inline-block'; // Ensure spinner is visible
    document.getElementById('addAttachmentButton').disabled = true;

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData // Use FormData to handle binary data properly
        });

        if (response.ok) {
            const result = await response.json();
            alert('Attachment added successfully: ' + result.fileName); // Display the correct file name
        } else {
            const errorText = await response.text();
            console.error('Error response:', errorText); // Log detailed error for debugging
            alert('Error adding attachment: ' + errorText);
        }
    } catch (error) {
        console.error('Upload error:', error); // Log error for debugging
        alert('An error occurred: ' + error.message);
    } finally {
        // Hide loader and enable button
        loaderAddAttachment.style.display = 'none'; // Ensure spinner is hidden
        document.getElementById('addAttachmentButton').disabled = false;
    }
});
