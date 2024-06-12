import { Test } from '@nestjs/testing';

import { RoleListInput, RoleListOutput, RoleListUsecase } from '@/core/role/use-cases/role-list';
import { IRoleListAdapter } from '@/modules/role/adapter';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { IRoleRepository } from '../../repository/role';
import { RoleEntity, RoleEnum } from './../../entity/role';

const successInput: RoleListInput = { limit: 1, page: 1, search: {}, sort: { createdAt: -1 } };

const failureInput: RoleListInput = { search: null, sort: null, limit: 10, page: 1 };

describe('RoleListUsecase', () => {
  let usecase: IRoleListAdapter;
  let repository: IRoleRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IRoleRepository,
          useValue: {}
        },
        {
          provide: IRoleListAdapter,
          useFactory: (roleRepository: IRoleRepository) => {
            return new RoleListUsecase(roleRepository);
          },
          inject: [IRoleRepository]
        }
      ]
    }).compile();

    usecase = app.get(IRoleListAdapter);
    repository = app.get(IRoleRepository);
  });

  test('when sort input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute(failureInput),
      (issues) => {
        expect(issues).toEqual([{ message: 'Expected object, received null', path: 'sort' }]);
      }
    );
  });

  test('when role are found, should expect an role list', async () => {
    const doc = new RoleEntity({
      id: getMockUUID(),
      name: RoleEnum.USER,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const paginateOutput: RoleListOutput = { docs: [doc], page: 1, limit: 1, total: 1 };

    repository.paginate = jest.fn().mockResolvedValue(paginateOutput);

    await expect(usecase.execute(successInput)).resolves.toEqual({
      docs: [doc],
      page: 1,
      limit: 1,
      total: 1
    });
  });

  test('when role not found, should expect an empty list', async () => {
    const paginateOutput: RoleListOutput = { docs: [], page: 1, limit: 1, total: 1 };

    repository.paginate = jest.fn().mockResolvedValue(paginateOutput);

    await expect(usecase.execute(successInput)).resolves.toEqual(paginateOutput);
  });
});
