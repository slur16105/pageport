// 존재하지 않는 주소로 들어왔을 때 공통 디자인 안에서 이유와 다음 행동을 안내하는 404 화면입니다.
import { AccessNotice } from "../components/AccessNotice";

export default function NotFound() {
  return <AccessNotice reason="not-found" />;
}
