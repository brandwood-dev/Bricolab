import { plainToInstance } from "class-transformer";

export async function paginate<T, R = T>(
  model: any,
  page: number,
  limit: number,
  dto?: new (...args: any[]) => R,
  searchFields: string[] = [],
  searchQuery: string = ''
): Promise<{
  data: R[];
  total: number;
  page: number;
  lastPage: number;
}> {
  const skip = (page - 1) * limit;
  console.log(`Paginating: page=${page}, limit=${limit}, skip=${skip}, searchQuery=${searchQuery}, searchFields=${searchFields}`);
  const where =
    searchQuery && searchFields.length > 0
      ? {
          OR: searchFields.map((field) => ({
            [field]: {
              contains: searchQuery,
              mode: 'insensitive',
            },
          })),
        }
      : {};
  const data = await model.findMany({ where,skip, take: limit });
  const total = await model.count({ where });

  const lastPage = Math.ceil(total / limit);

  return {
    data:dto ? plainToInstance(dto, data) : data,
    total,
    page,
    lastPage,
  };
}
