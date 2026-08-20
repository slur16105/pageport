// 이 파일은 화면의 여러 스타일 이름을 충돌 없이 합쳐 주는 공용 도우미입니다.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
