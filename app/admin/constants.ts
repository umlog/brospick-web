// 하위 호환성 유지를 위한 re-export facade
// 기존 import 경로 (import { STATUS_OPTIONS } from '../constants') 그대로 동작
export {
  ORDER_STATUS_OPTIONS as STATUS_OPTIONS,
  RETURN_STATUS_OPTIONS,
  RETURN_STATUS_TRANSITIONS,
} from '@/lib/domain/constants';
export { DELAY_STATUS_REGEX } from '@/lib/domain/enums';
