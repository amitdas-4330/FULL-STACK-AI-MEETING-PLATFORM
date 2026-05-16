const wrapPdfText = (text, maxLength = 84) => {

  const words = String(text || "").split(/\s+/);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const nextLine = line
      ? `${line} ${word}`
      : word;

    if (nextLine.length > maxLength) {
      if (line) {
        lines.push(line);
      }
      line = word;
      return;
    }

    line = nextLine;
  });

  if (line) {
    lines.push(line);
  }

  return lines;

};

const escapePdfText = (text) =>
  String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

export const createMeetingReportPdf = (report) => {

  const attendance = report.attendance || [];
  const endedAt = report.endedAt
    ? new Date(report.endedAt).toLocaleString()
    : new Date().toLocaleString();

  const lines = [
    {
      text: "Meeting Report",
      size: 18,
    },
    {
      text: `Room: ${report.roomId || "Unknown"}`,
      size: 11,
    },
    {
      text: `Date: ${endedAt}`,
      size: 11,
    },
    {
      text: "",
      size: 11,
    },
    {
      text: "Summary",
      size: 14,
    },
    ...wrapPdfText(
      report.summary ||
        "No summary was generated for this meeting.",
      82
    ).map((text) => ({
      text,
      size: 11,
    })),
    {
      text: "",
      size: 11,
    },
    {
      text: "Attendance",
      size: 14,
    },
    ...(attendance.length
      ? attendance.map((user) => ({
          text:
            `${user.name || "Guest"} - ` +
            `${user.elapsedMinutes || 0} min - ` +
            `${user.present ? "Present" : "Waiting"}`,
          size: 11,
        }))
      : [
          {
            text: "No attendance data was captured.",
            size: 11,
          },
        ]),
  ];

  const pages = [];
  let currentPage = [];
  let y = 790;

  lines.forEach((line) => {
    if (y < 60) {
      pages.push(currentPage);
      currentPage = [];
      y = 790;
    }

    currentPage.push({
      ...line,
      y,
    });
    y -= line.text ? line.size + 8 : 14;
  });

  if (currentPage.length) {
    pages.push(currentPage);
  }

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  const pageRefs = pages.map((_, index) => 4 + index * 2);
  objects[1] =
    `<< /Type /Pages /Kids [${pageRefs
      .map((ref) => `${ref} 0 R`)
      .join(" ")}] /Count ${pages.length} >>`;

  pages.forEach((page, index) => {
    const pageObjectRef = 4 + index * 2;
    const contentObjectRef = pageObjectRef + 1;
    const content = [
      "BT",
      ...page.map(
        (line) =>
          `/F1 ${line.size} Tf 1 0 0 1 50 ${line.y} Tm ` +
          `(${escapePdfText(line.text)}) Tj`
      ),
      "ET",
    ].join("\n");

    objects[pageObjectRef - 1] =
      "<< /Type /Page /Parent 2 0 R " +
      "/MediaBox [0 0 595 842] " +
      "/Resources << /Font << /F1 3 0 R >> >> " +
      `/Contents ${contentObjectRef} 0 R >>`;
    objects[contentObjectRef - 1] =
      `<< /Length ${content.length} >>\n` +
      `stream\n${content}\nendstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;

  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF`;

  return new Blob(
    [pdf],
    {
      type: "application/pdf",
    }
  );

};

export const downloadMeetingReport = (report) => {

  const pdfBlob = createMeetingReportPdf(report);
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `meeting-report-${report.roomId || "room"}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

};
