export class NewTasksPositionsDto {
  tasks: { taskId: number; previousId: number | undefined }[];
}
