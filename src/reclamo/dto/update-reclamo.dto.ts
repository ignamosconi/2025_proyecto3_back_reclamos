import { CreateReclamoDto } from "./create-reclamo.dto";
import { PartialType } from "@nestjs/mapped-types";

export class UpdateReclamoDto extends PartialType(CreateReclamoDto) {}