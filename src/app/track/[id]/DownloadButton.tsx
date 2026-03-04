"use client";

export default function DownloadButton({
  audioUrl,
  name,
}: {
  audioUrl: string;
  name: string;
}) {
  const handleDownload = async () => {
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}-roast-by-roasttrack.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(audioUrl, "_blank");
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      Download MP3
    </button>
  );
}
