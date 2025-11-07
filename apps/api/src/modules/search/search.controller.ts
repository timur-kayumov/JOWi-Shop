import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller('search')
@Public() // TODO: Remove @Public() when frontend auth is implemented
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query() query: SearchQueryDto, @Req() req: any) {
    // Extract tenantId from JWT token (set by TenantGuard)
    // For now, use the seeded business tenant ID for development/mock data
    const tenantId = req.user?.tenantId || '424af838-23a4-40ae-bb7c-a7243106026e';

    return this.searchService.globalSearch(query, tenantId);
  }
}
