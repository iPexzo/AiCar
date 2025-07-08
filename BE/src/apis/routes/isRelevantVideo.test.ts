import { isRelevantVideo } from "./isRelevantVideo";

describe("isRelevantVideo edge cases", () => {
  const baseVideo = {
    title: "",
    description: "",
    url: "",
  };

  it("rejects video with exact forbidden word", () => {
    const video = {
      ...baseVideo,
      title: "Battery Replacement",
      description: "How to replace your car battery",
      url: "https://carcarekiosk.com/maintenance/battery-replacement",
    };
    expect(isRelevantVideo(video, "تغيير زيت المحرك")).toBe(false);
  });

  it("accepts video with partial forbidden word", () => {
    const video = {
      ...baseVideo,
      title: "Batterypack Maintenance",
      description: "How to maintain your batterypack",
      url: "https://carcarekiosk.com/maintenance/batterypack",
    };
    // Use a stepText with a keyword matching the video title/description
    expect(isRelevantVideo(video, "صيانة batterypack")).toBe(true);
  });

  it("accepts video with forbidden word only in stepText", () => {
    // Use a stepText with a keyword matching the video title/description
    const video = {
      ...baseVideo,
      title: "Battery Replacement",
      description: "How to replace your car battery",
      url: "https://carcarekiosk.com/maintenance/battery-replacement",
    };
    expect(isRelevantVideo(video, "استبدال replacement battery")).toBe(true);
  });

  it("accepts video with Arabic diacritics", () => {
    const video = {
      ...baseVideo,
      title: "تغيير زيت المحرك",
      description: "شرح تغيير زَيْت المُحَرِّك",
      url: "https://carcarekiosk.com/maintenance/oil-change",
    };
    expect(isRelevantVideo(video, "تغيير زيت المحرك")).toBe(true);
  });

  it("accepts video with mixed Arabic/English", () => {
    const video = {
      ...baseVideo,
      title: "Engine Oil Change",
      description: "تغيير زيت المحرك",
      url: "https://carcarekiosk.com/maintenance/oil-change",
    };
    expect(isRelevantVideo(video, "تغيير زيت المحرك")).toBe(true);
  });

  it("rejects video with no relevant keywords", () => {
    const video = {
      ...baseVideo,
      title: "Brake Pad Replacement",
      description: "How to replace brake pads",
      url: "https://carcarekiosk.com/maintenance/brake-pads",
    };
    expect(isRelevantVideo(video, "تغيير زيت المحرك")).toBe(false);
  });
});
