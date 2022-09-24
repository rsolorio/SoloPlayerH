import { Component, OnInit } from '@angular/core';
import { ElectronService } from 'src/app/core/services/electron/electron.service';
import { MusicMetadataService } from 'src/app/shared/services/music-metadata/music-metadata.service';

@Component({
  selector: 'sp-home-view',
  templateUrl: './home-view.component.html',
  styleUrls: ['./home-view.component.scss']
})
export class HomeViewComponent implements OnInit {

  constructor(public electronService: ElectronService, public metadataService: MusicMetadataService) { }

  ngOnInit(): void {
  }

  public onTest1(): void {
  }

  public onTest2(): void {
    this.electronService.openDevTools();
  }
}
