import { CategoryDocument } from 'src/category';

export class CategoryDto {
  id: string;

  name: string;

  parentId?: string;

  createdAt: string;

  updatedAt: string;

  static fromDocument(category: CategoryDocument) {
    const dto = new CategoryDto();
    dto.id = category.id;
    dto.name = category.name;
    dto.parentId = category.parent?._id.toString();
    dto.createdAt = category.createdAt.toISOString();
    dto.updatedAt = category.updatedAt.toISOString();
    return dto;
  }
}
