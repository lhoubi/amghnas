document.addEventListener('DOMContentLoaded', () => {
    const recordBtn = document.getElementById('recordBtn');
    const stopBtn = document.getElementById('stopBtn');
    const sendAudioBtn = document.getElementById('sendAudioBtn');
    const audioPlayback = document.getElementById('audioPlayback');
    const keyboardInput = document.getElementById('keyboardInput');

    let mediaRecorder;
    let audioChunks = [];
    let audioBlob;

    // Check for MediaRecorder support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support audio recording. Please use Chrome, Firefox, or Edge.');
        recordBtn.disabled = true;
        return;
    }

    recordBtn.onclick = async () => {
        audioChunks = []; // Clear previous recordings
        audioPlayback.style.display = 'none';
        sendAudioBtn.disabled = true;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            mediaRecorder.start();

            recordBtn.disabled = true;
            stopBtn.disabled = false;
            console.log('Recording started...');

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                audioBlob = new Blob(audioChunks, { type: 'audio/webm' }); // Use webm for compatibility
                audioPlayback.src = URL.createObjectURL(audioBlob);
                audioPlayback.style.display = 'block';

                stopBtn.disabled = true;
                recordBtn.disabled = false;
                sendAudioBtn.disabled = false; // Enable send button after recording
                console.log('Recording stopped. Audio available for playback.');

                // Stop all tracks on the stream to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone. Please check permissions.');
            recordBtn.disabled = false;
            stopBtn.disabled = true;
        }
    };

    stopBtn.onclick = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
        }
    };

    sendAudioBtn.onclick = async () => {
        if (!audioBlob) {
            alert('Please record audio first!');
            return;
        }

        sendAudioBtn.disabled = true;
        sendAudioBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Transcribing...';
        keyboardInput.placeholder = 'Transcribing audio...';

        console.log('Sending audio for transcription...');

        // *** THIS IS THE CRITICAL PART: WHERE YOU'D SEND TO AN STT API ***
        // Replace this with your actual API call.
        // For demonstration, let's simulate a delay and placeholder response.

        try {
            // Example of sending via FormData (for a real backend endpoint)
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');
            // formData.append('language', 'berber'); // Optionally send language hint

            // Assuming you have a backend endpoint like '/transcribe-berber'
            // const response = await fetch('/transcribe-berber', {
            //     method: 'POST',
            //     body: formData
            // });
            // const data = await response.json();
            // const latinText = data.transcription; // Get Latin text from API

            // SIMULATED RESPONSE:
            await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate API call delay
            const simulatedLatinText = "azul fella-wen, manzaɣ akken tella tmezruyt n tmaziɣt."; // Example Latin Berber

            // Now, convert Latin Berber to Tifinagh (you'll need your conversion logic here)
            // This is a placeholder; you'd integrate your existing keyboard.js conversion logic here
            const tifinaghText = convertLatinBerberToTifinagh(simulatedLatinText);

            keyboardInput.value = tifinaghText;
            keyboardInput.placeholder = "Start typing in Tifinagh, Latin, or Arabic here...";

        } catch (error) {
            console.error('Error during transcription:', error);
            alert('Failed to transcribe audio. Please try again.');
        } finally {
            sendAudioBtn.disabled = false;
            sendAudioBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Transcribe Audio';
        }
    };

    // Placeholder for your Latin Berber to Tifinagh conversion logic.
    // You would adapt or reuse logic from your `keyboard.js` here.
    function convertLatinBerberToTifinagh(latinText) {
        // This is a very simplified example. Your real conversion needs to be comprehensive.
        let tifinagh = latinText
            .replace(/a/g, 'ⴰ')
            .replace(/z/g, 'ⵣ')
            .replace(/u/g, 'ⵓ')
            .replace(/l/g, 'ⵍ')
            .replace(/f/g, 'ⴼ')
            .replace(/e/g, 'ⴻ')
            .replace(/n/g, 'ⵏ')
            .replace(/t/g, 'ⵜ')
            .replace(/w/g, 'ⵡ')
            .replace(/m/g, 'ⵎ')
            .replace(/s/g, 'ⵙ')
            .replace(/b/g, 'ⴱ')
            .replace(/h/g, 'ⵀ')
            .replace(/r/g, 'ⵔ')
            .replace(/d/g, 'ⴷ')
            // ... add all your mappings here
            .replace(/\./g, ' .')
            .replace(/,/g, ' ,');

        return tifinagh;
    }

});