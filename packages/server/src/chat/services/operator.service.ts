import crypto from 'node:crypto';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@m8a/nestjs-typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { AnyKeys } from 'mongoose';
import { hash } from '@node-rs/argon2';

import { Operator } from '../models';
import {
  CreateOperatorData,
  GetOperatorsOptions,
  UpdateOperatorData,
} from '../interfaces';
import { OperatorRole, OperatorStatus } from '../constants';

@Injectable()
export class OperatorService implements OnApplicationBootstrap {
  @InjectModel(Operator)
  private operatorModel: ReturnModelType<typeof Operator>;

  generateRandomPassword(length: number) {
    if (length <= 0) {
      throw new Error('Password length must be greater than 0');
    }

    // Define the character set for the password
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';

    // Create a buffer to store random bytes
    const randomBytes = crypto.randomBytes(length);

    // Initialize an empty password string
    let password = '';

    for (let i = 0; i < length; i++) {
      // Generate a random index within the charset length
      const randomIndex = randomBytes[i] % charset.length;

      // Append the character at the random index to the password
      password += charset[randomIndex];
    }

    return password;
  }

  async onApplicationBootstrap() {
    const result = await this.createDefaultOperator();
    if (result) {
      console.log('admin account created', {
        username: result.admin.username,
        password: result.password,
      });
    }
  }

  async createOperator(data: CreateOperatorData) {
    const operator = new this.operatorModel({
      role: data.role,
      username: data.username,
      internalName: data.internalName,
      externalName: data.externalName,
      concurrency: data.concurrency ?? 0,
    });
    await operator.setPassword(data.password);
    await operator.save();
    delete operator.password;
    return operator;
  }

  getOperator(id: string) {
    return this.operatorModel.findById(id).exec();
  }

  getOperators(options: GetOperatorsOptions = {}) {
    const query = this.operatorModel.find();
    if (options.ids) {
      query.where('_id', { $in: options.ids });
    }
    if (options.inactive !== undefined) {
      if (options.inactive) {
        query.where('inactive', true);
      } else {
        query.where('inactive', { $exists: false });
      }
    }
    return query.exec();
  }

  getReadyOperators() {
    return this.operatorModel
      .find({
        status: OperatorStatus.Ready,
        inactive: { $exists: false },
      })
      .exec();
  }

  getOperatorByUsername(username: string, selectPassword?: boolean) {
    const query = this.operatorModel.findOne({ username });
    if (selectPassword) {
      query.select('+password');
    }
    return query.exec();
  }

  async createDefaultOperator() {
    const existAdmin = await this.getOperatorByUsername('admin');
    if (existAdmin) {
      return;
    }

    const password = this.generateRandomPassword(16);

    try {
      const admin = await this.createOperator({
        role: OperatorRole.Admin,
        username: 'admin',
        password,
        externalName: '管理员',
        internalName: '管理员',
      });
      return { admin, password };
    } catch {}
  }

  async updateOperator(operatorId: string, data: UpdateOperatorData) {
    const $set: AnyKeys<Operator> = {
      role: data.role,
      externalName: data.externalName,
      internalName: data.internalName,
      concurrency: data.concurrency,
      workload: data.workload,
      status: data.status,
      statusUpdatedAt: data.statusUpdatedAt,
    };
    const $unset: AnyKeys<Operator> = {};

    if (data.password) {
      $set.password = await hash(data.password);
    }
    if (data.status !== undefined && !data.statusUpdatedAt) {
      $set.statusUpdatedAt = new Date();
    }
    if (data.inactive !== undefined) {
      if (data.inactive) {
        $set.inactive = true;
      } else {
        $unset.inactive = '';
      }
    }

    return this.operatorModel
      .findOneAndUpdate({ _id: operatorId }, { $set, $unset }, { new: true })
      .exec();
  }

  async increaseOperatorWorkload(operatorId: string, value: number) {
    await this.operatorModel.updateOne(
      { _id: operatorId },
      {
        $inc: {
          workload: value,
        },
      },
    );
  }
}
