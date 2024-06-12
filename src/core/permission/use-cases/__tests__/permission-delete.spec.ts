import { Test } from '@nestjs/testing';

import {
  PermissionDeleteInput,
  PermissionDeleteOutput,
  PermissionDeleteUsecase
} from '@/core/permission/use-cases/permission-delete';
import { IPermissionDeleteAdapter } from '@/modules/permission/adapter';
import { ApiNotFoundException } from '@/utils/exception';
import { expectZodError, getMockUUID } from '@/utils/tests';

import { IPermissionRepository } from '../../repository/permission';
import { PermissionEntity, PermissionEnum } from './../../entity/permission';

const successInput: PermissionDeleteInput = {
  id: getMockUUID()
};

const failureInput: PermissionDeleteInput = {};

describe('PermissionDeleteUsecase', () => {
  let usecase: IPermissionDeleteAdapter;
  let repository: IPermissionRepository;

  beforeEach(async () => {
    const app = await Test.createTestingModule({
      providers: [
        {
          provide: IPermissionRepository,
          useValue: {}
        },
        {
          provide: IPermissionDeleteAdapter,
          useFactory: (permissionRepository: IPermissionRepository) => {
            return new PermissionDeleteUsecase(permissionRepository);
          },
          inject: [IPermissionRepository]
        }
      ]
    }).compile();

    usecase = app.get(IPermissionDeleteAdapter);
    repository = app.get(IPermissionRepository);
  });

  test('when no input is specified, should expect an error', async () => {
    await expectZodError(
      () => usecase.execute(failureInput),
      (issues) => {
        expect(issues).toEqual([{ message: 'Required', path: PermissionEntity.nameOf('id') }]);
      }
    );
  });

  test('when permission not found, should expect an error', async () => {
    repository.findById = jest.fn().mockResolvedValue(null);

    await expect(usecase.execute(successInput)).rejects.toThrowError(ApiNotFoundException);
  });

  test('when permission deleted successfully, should expect a permission that has been deleted', async () => {
    const findByIdOutput: PermissionDeleteOutput = new PermissionEntity({
      id: getMockUUID(),
      name: PermissionEnum.ALL
    });

    repository.findById = jest.fn().mockResolvedValue(findByIdOutput);
    repository.updateOne = jest.fn();

    await expect(usecase.execute(successInput)).resolves.toEqual({
      ...findByIdOutput,
      deletedAt: expect.any(Date)
    });
  });
});
