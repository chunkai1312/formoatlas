import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
  ) {}

  async upsertUser(profile: GoogleProfile): Promise<UserDocument> {
    return this.userModel.findOneAndUpdate(
      { googleId: profile.googleId },
      {
        $set: {
          email: profile.email,
          name: profile.name,
          picture: profile.picture,
        },
        $setOnInsert: { watchList: [] },
      },
      { upsert: true, new: true },
    );
  }

  signJwt(user: UserDocument): string {
    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
      picture: user.picture,
    };
    return this.jwtService.sign(payload);
  }
}
