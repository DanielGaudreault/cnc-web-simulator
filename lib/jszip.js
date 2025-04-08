import JSZip from 'jszip';

const zip = new JSZip();
zip.file("hello.txt", "Hello, world!");

zip.generateAsync({ type: "blob" }).then(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "example.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

