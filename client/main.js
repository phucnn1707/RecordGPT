$(document).ready(function() {
    const button = document.getElementById("record-button");
    const recorder = new MicRecorder({
        bitRate: 128,
    });

    button.addEventListener("click", startRecording);

    function startRecording() {
        recorder
            .start()
            .then(() => {
                button.textContent = "Stop";
                button.classList.toggle("btn-danger");
                button.removeEventListener("click", startRecording);
                button.addEventListener("click", stopRecording);
            })
            .catch((e) => {
                console.error(e);
            });
    }

    const loader = $("#loading");

    function displayLoading() {
        loader.addClass("display");
    }

    function hideLoading() {
        loader.removeClass("display");
    }

    async function stopRecording() {
        displayLoading();
        try {
            const [buffer, blob] = await recorder.stop().getMp3();
            console.log(buffer, blob);

            const formData = new FormData();
            formData.append("audio", blob, "user_audio.mp3");

            const response = await fetch("http://localhost:3000/api/speech2speech", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // const userInput = document.getElementById("user-input");
            // userInput.value = data.transcription || "No transcription available";

            // const chatgptResponse = document.getElementById("chatgpt-response");
            // chatgptResponse.value = data.response || "No transcription available";

            const base64Data = data.chatgptAudio;
            const audioBlob = base64toBlob(base64Data, "audio/mpeg");

            const chatgptAudio = document.getElementById("chatgpt-audio");
            chatgptAudio.src = URL.createObjectURL(audioBlob);
            chatgptAudio.controls = true;
            chatgptAudio.play();
        } catch (error) {
            console.error("Error:", error);
        } finally {
            button.textContent = "Start";
            button.classList.toggle("btn-danger");
            button.removeEventListener("click", stopRecording);
            button.addEventListener("click", startRecording);
            hideLoading();
        }

        function base64toBlob(base64Data, contentType) {
            contentType = contentType || "";
            const sliceSize = 1024;
            const byteCharacters = atob(base64Data);
            const byteArrays = [];

            for (
                let offset = 0; offset < byteCharacters.length; offset += sliceSize
            ) {
                const slice = byteCharacters.slice(offset, offset + sliceSize);
                const byteNumbers = new Array(slice.length);
                for (let i = 0; i < slice.length; i++) {
                    byteNumbers[i] = slice.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }

            const blob = new Blob(byteArrays, { type: contentType });
            return blob;
        }
    }
});