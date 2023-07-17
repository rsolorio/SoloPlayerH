import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ChipSelectionService } from 'src/app/shared/components/chip-selection/chip-selection.service';
import { IEntityEditorModel } from 'src/app/shared/components/entity-editor/entity-editor.interface';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';

@Component({
  selector: 'sp-song-view',
  templateUrl: './song-view.component.html',
  styleUrls: ['./song-view.component.scss']
})
export class SongViewComponent implements OnInit {
  public entityEditorModel: IEntityEditorModel;
  constructor(
    private route: ActivatedRoute,
    private utility: UtilityService,
    private loadingService: LoadingViewStateService,
    private entityService: DatabaseEntitiesService,
    private navbarService: NavBarStateService,
    private chipSelectionService: ChipSelectionService
  ) { }

  ngOnInit(): void {
    const songId = this.utility.getRouteParam('id', this.route);
    this.initialize(songId);
  }

  private async initialize(songId: string): Promise<void> {
    this.loadingService.show();
    await this.loadModel(songId);
    this.initializeNavbar();
    this.loadingService.hide();
  }

  private async loadModel(songId: string): Promise<void> {
    const data = await this.entityService.getSongDetails(songId);
    this.entityEditorModel = {
      data: data,
      groups: [
        {
          fields: [
            {
              propertyName: 'song_name',
              icon: 'mdi-music mdi',
              label: 'Title'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'primaryArtistName',
              icon: 'mdi-account-music mdi',
              label: 'Artist'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'primaryAlbumName',
              icon: 'mdi-album mdi',
              label: 'Album'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'song_trackNumber',
              icon: 'mdi-pound mdi',
              label: 'Track',
              onEdit: () => {}
            },
            {
              propertyName: 'song_duration',
              icon: 'mdi-clock-outline mdi',
              label: 'Duration'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'song_releaseYear',
              icon: 'mdi-calendar-blank mdi',
              label: 'Year'
            },
            {
              propertyName: 'song_genre',
              icon: 'mdi-tag mdi',
              label: 'Genre',
              onEdit: () => {}
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'song_language',
              icon: 'mdi-translate mdi',
              label: 'Language',
              onEdit: () => {}
            },
            {
              propertyName: 'song_mood',
              icon: 'mdi-emoticon mdi',
              label: 'Mood',
              onEdit: () => {}
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'song_playCount',
              icon: 'mdi-play mdi',
              label: 'Play Count'
            },
            {
              propertyName: 'song_addDate',
              icon: 'mdi-calendar-plus mdi',
              label: 'Add Date'
            }
          ]
        }
      ]
    };    
  }

  private initializeNavbar(): void {
    this.navbarService.set({
      mode: NavbarDisplayMode.Title,
      show: true,
      menuList: [
        {
          caption: 'Some Option'
        }
      ],
      title: 'Song',
      leftIcon: {
        icon:  'mdi-music-note mdi'
      }
    });
  }

}
