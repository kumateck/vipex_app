import type {
  GenerateOperationsExceptionsBriefInput,
  GetLatestOperationsExceptionsBriefInput,
} from './dto';
import {
  generateOperationsExceptionsBriefSvc,
  getLatestOperationsExceptionsBriefSvc,
} from './service';

export async function generateOperationsExceptionsBriefCtrl(
  input: GenerateOperationsExceptionsBriefInput,
) {
  return generateOperationsExceptionsBriefSvc(input);
}

export async function getLatestOperationsExceptionsBriefCtrl(
  input: GetLatestOperationsExceptionsBriefInput,
) {
  return getLatestOperationsExceptionsBriefSvc(input);
}
