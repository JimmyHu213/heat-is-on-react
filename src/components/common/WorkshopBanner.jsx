import { MEDIA_CONFIG } from "../../constants/mediaConfig";
import "./WorkshopBanner.css";

export default function WorkshopBanner() {
  return (
    <header className="workshop-banner">
      <img src={MEDIA_CONFIG.loginCover}
        srcSet={`${MEDIA_CONFIG.loginCoverSmall} 640w, ${MEDIA_CONFIG.loginCover} 1200w`}
        sizes="100vw" alt="" />
      <h1>THE HEAT IS ON</h1>
    </header>
  );
}
