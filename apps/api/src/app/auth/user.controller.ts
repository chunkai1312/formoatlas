import { Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User, UserDocument } from './schemas/user.schema';
import { JwtPayload } from './auth.service';

@ApiTags('user')
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  @ApiOperation({ summary: '取得 Watch List' })
  @Get('watchlist')
  async getWatchList(@Req() req: Request) {
    const payload = req.user as JwtPayload;
    const user = await this.userModel.findById(payload.sub).select('watchList').lean();
    return user?.watchList ?? [];
  }

  @ApiOperation({ summary: '新增股票到 Watch List' })
  @Post('watchlist/:symbol')
  async addToWatchList(@Param('symbol') symbol: string, @Req() req: Request) {
    const payload = req.user as JwtPayload;
    const user = await this.userModel.findByIdAndUpdate(
      payload.sub,
      { $addToSet: { watchList: symbol } },
      { new: true },
    ).select('watchList').lean();
    return user?.watchList ?? [];
  }

  @ApiOperation({ summary: '從 Watch List 移除股票' })
  @Delete('watchlist/:symbol')
  async removeFromWatchList(@Param('symbol') symbol: string, @Req() req: Request) {
    const payload = req.user as JwtPayload;
    const user = await this.userModel.findByIdAndUpdate(
      payload.sub,
      { $pull: { watchList: symbol } },
      { new: true },
    ).select('watchList').lean();
    return user?.watchList ?? [];
  }
}
