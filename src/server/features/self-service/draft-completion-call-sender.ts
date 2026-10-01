export function resolveCompletedCallSender(draftChoice: boolean, officerChoice?: boolean) {
  return officerChoice ?? draftChoice;
}
